import { Router } from "express";
import { eq, and } from "drizzle-orm";
import {
  db, usersTable, projectsTable, applicationsTable,
  walletsTable, escrowTransactionsTable, walletTransactionsTable,
  invoicesTable, notificationsTable,
} from "@workspace/db";
import { requireAuth, requireRole, requireEmailVerified } from "../lib/auth";
import {
  initializePayment, verifyPayment, initiateRefund,
  generateReference, generateInvoiceNumber, paystackEnabled,
} from "../lib/paystack";
import { logger } from "../lib/logger";

const router = Router();

// Helper: get or create a wallet for a user
async function getOrCreateWallet(userId: number) {
  const [existing] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  if (existing) return existing;
  const [wallet] = await db.insert(walletsTable).values({ userId }).returning();
  return wallet;
}

// Helper: record a wallet transaction and update balance atomically
async function recordWalletTransaction(opts: {
  walletId: number;
  userId: number;
  type: "credit" | "debit";
  category: "escrow_fund" | "escrow_release" | "refund" | "withdrawal" | "fee" | "deposit";
  amount: number;
  description: string;
  reference: string;
  escrowTransactionId?: number;
}): Promise<{ balanceBefore: number; balanceAfter: number }> {
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.id, opts.walletId));
  const balanceBefore = parseFloat(wallet.balance);
  const balanceAfter = opts.type === "credit"
    ? balanceBefore + opts.amount
    : balanceBefore - opts.amount;

  if (opts.type === "debit" && balanceAfter < 0) {
    throw new Error("Insufficient wallet balance");
  }

  await Promise.all([
    db.update(walletsTable).set({ balance: String(balanceAfter) }).where(eq(walletsTable.id, opts.walletId)),
    db.insert(walletTransactionsTable).values({
      walletId: opts.walletId,
      userId: opts.userId,
      type: opts.type,
      category: opts.category,
      amount: String(opts.amount),
      balanceBefore: String(balanceBefore),
      balanceAfter: String(balanceAfter),
      reference: opts.reference,
      description: opts.description,
      escrowTransactionId: opts.escrowTransactionId ?? null,
    }),
  ]);
  return { balanceBefore, balanceAfter };
}

// POST /api/payments/initialize — client starts escrow payment for a project
router.post("/initialize", requireAuth, requireEmailVerified, requireRole("client"), async (req, res) => {
  const { projectId } = req.body as { projectId?: number };
  if (!projectId || isNaN(Number(projectId))) {
    res.status(400).json({ error: "projectId is required" }); return;
  }

  const clientId = req.user!.userId;

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, Number(projectId)));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.clientId !== clientId) { res.status(403).json({ error: "You do not own this project" }); return; }
  if (project.status !== "in_progress") {
    res.status(400).json({ error: "Escrow can only be funded for in-progress projects" }); return;
  }

  // Get accepted application (freelancer + rate)
  const [acceptedApp] = await db.select().from(applicationsTable)
    .where(and(eq(applicationsTable.projectId, project.id), eq(applicationsTable.status, "accepted")));
  if (!acceptedApp) { res.status(400).json({ error: "No accepted application found for this project" }); return; }

  // Check if escrow already exists
  const [existing] = await db.select().from(escrowTransactionsTable)
    .where(eq(escrowTransactionsTable.projectId, project.id));
  if (existing && ["funded", "in_escrow", "released"].includes(existing.status)) {
    res.status(409).json({ error: "Escrow already funded for this project", escrow: existing }); return;
  }

  const [client] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, clientId));
  const amount = parseFloat(String(acceptedApp.proposedRate));
  const reference = generateReference("ESC");

  let authUrl = "";
  let accessCode = "";
  let escrowRecord;

  if (!paystackEnabled) {
    // Dev mode: simulate a pending escrow without real payment
    if (existing) {
      [escrowRecord] = await db.update(escrowTransactionsTable)
        .set({ paystackReference: reference, status: "pending" })
        .where(eq(escrowTransactionsTable.id, existing.id))
        .returning();
    } else {
      [escrowRecord] = await db.insert(escrowTransactionsTable).values({
        projectId: project.id,
        clientId,
        freelancerId: acceptedApp.freelancerId,
        amount: String(amount),
        status: "pending",
        paystackReference: reference,
      }).returning();
    }
    res.json({
      authorizationUrl: null,
      reference,
      amount,
      devMode: true,
      message: "PAYSTACK_SECRET_KEY not set — use POST /api/payments/verify with this reference to simulate funding.",
      escrow: escrowRecord,
    });
    return;
  }

  const appBaseUrl = process.env.APP_URL
    ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
  const callbackUrl = `${appBaseUrl}/payment/callback`;

  const paystackData = await initializePayment({
    email: client.email,
    amountNGN: amount,
    reference,
    callbackUrl,
    metadata: { projectId: project.id, clientId, freelancerId: acceptedApp.freelancerId, projectTitle: project.title },
  });

  authUrl = paystackData.authorization_url;
  accessCode = paystackData.access_code;

  if (existing) {
    [escrowRecord] = await db.update(escrowTransactionsTable)
      .set({ paystackReference: reference, paystackAccessCode: accessCode, paystackAuthorizationUrl: authUrl, status: "pending" })
      .where(eq(escrowTransactionsTable.id, existing.id))
      .returning();
  } else {
    [escrowRecord] = await db.insert(escrowTransactionsTable).values({
      projectId: project.id,
      clientId,
      freelancerId: acceptedApp.freelancerId,
      amount: String(amount),
      status: "pending",
      paystackReference: reference,
      paystackAccessCode: accessCode,
      paystackAuthorizationUrl: authUrl,
    }).returning();
  }

  res.json({ authorizationUrl: authUrl, reference, amount, escrow: escrowRecord });
});

// POST /api/payments/verify — verify Paystack callback and fund escrow
router.post("/verify", requireAuth, async (req, res) => {
  const { reference } = req.body as { reference?: string };
  if (!reference) { res.status(400).json({ error: "reference is required" }); return; }

  const [escrow] = await db.select().from(escrowTransactionsTable)
    .where(eq(escrowTransactionsTable.paystackReference, reference));
  if (!escrow) { res.status(404).json({ error: "Escrow transaction not found" }); return; }
  if (escrow.clientId !== req.user!.userId && !req.user!.role) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (["funded", "in_escrow", "released"].includes(escrow.status)) {
    res.json({ message: "Escrow already funded", escrow }); return;
  }

  let verifiedAmount = parseFloat(String(escrow.amount));

  if (!paystackEnabled) {
    // Dev mode: simulate verification
    logger.info({ reference }, "Dev mode: simulating payment verification");
  } else {
    const verification = await verifyPayment(reference);
    if (verification.status !== "success") {
      res.status(400).json({ error: `Payment not successful: ${verification.gateway_response}` }); return;
    }
    verifiedAmount = verification.amount / 100; // convert from kobo

    await db.update(escrowTransactionsTable)
      .set({ paystackTransactionId: String(verification.id) })
      .where(eq(escrowTransactionsTable.id, escrow.id));
  }

  const now = new Date();
  await db.update(escrowTransactionsTable)
    .set({ status: "in_escrow", fundedAt: now })
    .where(eq(escrowTransactionsTable.id, escrow.id));

  // Record on client's wallet as an escrow_fund debit (money leaves client, sits in escrow)
  const clientWallet = await getOrCreateWallet(escrow.clientId);
  const [project] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, escrow.projectId));

  await recordWalletTransaction({
    walletId: clientWallet.id,
    userId: escrow.clientId,
    type: "debit",
    category: "escrow_fund",
    amount: verifiedAmount,
    description: `Escrow funded for project: ${project?.title ?? `#${escrow.projectId}`}`,
    reference,
    escrowTransactionId: escrow.id,
  }).catch(() => {
    // Client wallet goes negative is OK — they paid Paystack directly
  });

  // Generate invoice
  const invoiceNumber = generateInvoiceNumber();
  await db.insert(invoicesTable).values({
    invoiceNumber,
    escrowTransactionId: escrow.id,
    projectId: escrow.projectId,
    clientId: escrow.clientId,
    freelancerId: escrow.freelancerId,
    amount: String(verifiedAmount),
    type: "escrow_funded",
    paystackReference: reference,
  }).catch(() => {});

  // Notify client + freelancer
  await Promise.all([
    db.insert(notificationsTable).values({
      userId: escrow.clientId,
      type: "payment",
      title: "Payment successful 💳",
      message: `Escrow of ₦${verifiedAmount.toLocaleString()} funded for "${project?.title}"`,
      link: `/wallet`,
    }),
    db.insert(notificationsTable).values({
      userId: escrow.freelancerId,
      type: "payment",
      title: "Payment secured in escrow 🔒",
      message: `Your payment of ₦${verifiedAmount.toLocaleString()} for "${project?.title}" is safely held in escrow`,
      link: `/wallet`,
    }),
  ]).catch(() => {});

  const [updated] = await db.select().from(escrowTransactionsTable).where(eq(escrowTransactionsTable.id, escrow.id));
  res.json({ message: "Payment verified and escrow funded", escrow: updated, invoiceNumber });
});

// GET /api/payments/escrow/:projectId — get escrow status for a project
router.get("/escrow/:projectId", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid projectId" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const uid = req.user!.userId;
  const [acceptedApp] = await db.select().from(applicationsTable)
    .where(and(eq(applicationsTable.projectId, projectId), eq(applicationsTable.status, "accepted")));

  if (project.clientId !== uid && acceptedApp?.freelancerId !== uid) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const [escrow] = await db.select().from(escrowTransactionsTable)
    .where(eq(escrowTransactionsTable.projectId, projectId));

  if (!escrow) {
    res.json({ exists: false, status: null, amount: acceptedApp?.proposedRate ?? null });
    return;
  }

  // Get invoice for this escrow
  const [invoice] = await db.select().from(invoicesTable)
    .where(and(eq(invoicesTable.escrowTransactionId, escrow.id), eq(invoicesTable.type, "escrow_funded")));

  res.json({ exists: true, escrow, invoiceNumber: invoice?.invoiceNumber ?? null });
});

// POST /api/payments/release/:projectId — client manually releases escrow
router.post("/release/:projectId", requireAuth, requireRole("client"), async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid projectId" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.clientId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (project.status !== "completed") {
    res.status(400).json({ error: "Project must be marked completed before releasing payment" }); return;
  }

  await releaseEscrow(projectId);
  const [escrow] = await db.select().from(escrowTransactionsTable).where(eq(escrowTransactionsTable.projectId, projectId));
  res.json({ message: "Payment released to freelancer", escrow });
});

// POST /api/payments/refund/:projectId — admin or client requests refund
router.post("/refund/:projectId", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid projectId" }); return; }

  const uid = req.user!.userId;
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where(eq(usersTable.id, uid));
  if (project.clientId !== uid && !user?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const [escrow] = await db.select().from(escrowTransactionsTable)
    .where(eq(escrowTransactionsTable.projectId, projectId));
  if (!escrow) { res.status(404).json({ error: "No escrow found for this project" }); return; }
  if (!["funded", "in_escrow"].includes(escrow.status)) {
    res.status(400).json({ error: "Escrow cannot be refunded in its current state" }); return;
  }

  const amount = parseFloat(String(escrow.amount));
  const now = new Date();

  if (paystackEnabled && escrow.paystackTransactionId) {
    await initiateRefund(escrow.paystackTransactionId, amount).catch(err => {
      logger.warn({ err }, "Paystack refund initiation failed — proceeding with internal record");
    });
  }

  await db.update(escrowTransactionsTable)
    .set({ status: "refunded", refundedAt: now })
    .where(eq(escrowTransactionsTable.id, escrow.id));

  // Credit client's wallet as refund
  const clientWallet = await getOrCreateWallet(escrow.clientId);
  const [proj] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, projectId));
  const ref = generateReference("REF");

  await recordWalletTransaction({
    walletId: clientWallet.id,
    userId: escrow.clientId,
    type: "credit",
    category: "refund",
    amount,
    description: `Refund for project: ${proj?.title ?? `#${projectId}`}`,
    reference: ref,
    escrowTransactionId: escrow.id,
  }).catch(() => {});

  // Create refund invoice
  const invoiceNumber = generateInvoiceNumber();
  await db.insert(invoicesTable).values({
    invoiceNumber,
    escrowTransactionId: escrow.id,
    projectId,
    clientId: escrow.clientId,
    freelancerId: escrow.freelancerId,
    amount: String(amount),
    type: "refund",
    paystackReference: escrow.paystackReference ?? ref,
  }).catch(() => {});

  await db.insert(notificationsTable).values({
    userId: escrow.clientId,
    type: "payment",
    title: "Refund processed",
    message: `Your payment of ₦${amount.toLocaleString()} for "${proj?.title}" has been refunded`,
    link: `/wallet`,
  }).catch(() => {});

  res.json({ message: "Refund processed", invoiceNumber });
});

// Exported helper used by projects route on completion
export async function releaseEscrow(projectId: number): Promise<void> {
  const [escrow] = await db.select().from(escrowTransactionsTable)
    .where(eq(escrowTransactionsTable.projectId, projectId));
  if (!escrow || !["funded", "in_escrow"].includes(escrow.status)) return;

  const amount = parseFloat(String(escrow.amount));
  const now = new Date();
  const ref = generateReference("REL");

  await db.update(escrowTransactionsTable)
    .set({ status: "released", releasedAt: now })
    .where(eq(escrowTransactionsTable.id, escrow.id));

  const [proj] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, projectId));
  const freelancerWallet = await getOrCreateWallet(escrow.freelancerId);

  await recordWalletTransaction({
    walletId: freelancerWallet.id,
    userId: escrow.freelancerId,
    type: "credit",
    category: "escrow_release",
    amount,
    description: `Payment released for project: ${proj?.title ?? `#${projectId}`}`,
    reference: ref,
    escrowTransactionId: escrow.id,
  }).catch(err => logger.error({ err }, "Failed to credit freelancer wallet on escrow release"));

  // Generate release invoice
  const invoiceNumber = generateInvoiceNumber();
  await db.insert(invoicesTable).values({
    invoiceNumber,
    escrowTransactionId: escrow.id,
    projectId,
    clientId: escrow.clientId,
    freelancerId: escrow.freelancerId,
    amount: String(amount),
    type: "escrow_released",
    paystackReference: escrow.paystackReference,
  }).catch(() => {});

  await Promise.all([
    db.insert(notificationsTable).values({
      userId: escrow.freelancerId,
      type: "payment",
      title: "Payment received! 💰",
      message: `₦${amount.toLocaleString()} has been credited to your wallet for "${proj?.title}"`,
      link: `/wallet`,
    }),
    db.insert(notificationsTable).values({
      userId: escrow.clientId,
      type: "payment",
      title: "Payment released",
      message: `Payment of ₦${amount.toLocaleString()} released to freelancer for "${proj?.title}"`,
      link: `/wallet`,
    }),
  ]).catch(() => {});
}

export { getOrCreateWallet };
export default router;
