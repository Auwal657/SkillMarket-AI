import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import {
  db,
  projectInvitationsTable,
  projectsTable,
  usersTable,
  freelancerProfilesTable,
  notificationsTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

// POST /api/invitations — client sends invite to a freelancer for a project
router.post("/", requireAuth, requireRole("client"), async (req, res) => {
  const { projectId, freelancerProfileId, message } = req.body as {
    projectId: number;
    freelancerProfileId: number;
    message?: string;
  };

  if (!projectId || !freelancerProfileId) {
    res.status(400).json({ error: "projectId and freelancerProfileId are required" });
    return;
  }

  const clientId = req.user!.userId;

  // Verify project belongs to this client
  const [project] = await db
    .select({ id: projectsTable.id, title: projectsTable.title, status: projectsTable.status })
    .from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.clientId, clientId)));

  if (!project) {
    res.status(404).json({ error: "Project not found or not yours" });
    return;
  }
  if (project.status !== "open") {
    res.status(400).json({ error: "Can only invite freelancers to open projects" });
    return;
  }

  // Verify freelancer profile exists and get userId for notification
  const [freelancer] = await db
    .select({ id: freelancerProfilesTable.id, userId: freelancerProfilesTable.userId })
    .from(freelancerProfilesTable)
    .where(eq(freelancerProfilesTable.id, freelancerProfileId));

  if (!freelancer) {
    res.status(404).json({ error: "Freelancer profile not found" });
    return;
  }

  // Check for duplicate invite
  const [existing] = await db
    .select({ id: projectInvitationsTable.id, status: projectInvitationsTable.status })
    .from(projectInvitationsTable)
    .where(
      and(
        eq(projectInvitationsTable.projectId, projectId),
        eq(projectInvitationsTable.freelancerProfileId, freelancerProfileId)
      )
    );

  if (existing) {
    if (existing.status === "pending") {
      res.status(409).json({ error: "An invitation is already pending for this freelancer on this project" });
      return;
    }
    // Re-invite if previously declined — update status back to pending
    await db
      .update(projectInvitationsTable)
      .set({ status: "pending", message: message ?? null, updatedAt: new Date() })
      .where(eq(projectInvitationsTable.id, existing.id));

    res.json({ id: existing.id, status: "pending", message: "Invitation re-sent" });
    return;
  }

  const [invite] = await db
    .insert(projectInvitationsTable)
    .values({ projectId, clientId, freelancerProfileId, message: message ?? null })
    .returning();

  // Get client name for the notification message
  const [client] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, clientId));

  // Notify the freelancer
  await db.insert(notificationsTable).values({
    userId: freelancer.userId,
    type: "project_invitation",
    title: "You've been invited to a project",
    message: `${client?.name ?? "A client"} invited you to work on "${project.title}"`,
    link: `/invitations`,
  });

  res.status(201).json(invite);
});

// GET /api/invitations — list invitations for the current user
// Freelancer sees received invites; client sees sent invites
router.get("/", requireAuth, async (req, res) => {
  const { userId, role } = req.user!;

  if (role === "freelancer") {
    // Find this user's freelancer profile
    const [profile] = await db
      .select({ id: freelancerProfilesTable.id })
      .from(freelancerProfilesTable)
      .where(eq(freelancerProfilesTable.userId, userId));

    if (!profile) {
      res.json([]);
      return;
    }

    const invites = await db
      .select({
        id: projectInvitationsTable.id,
        status: projectInvitationsTable.status,
        message: projectInvitationsTable.message,
        createdAt: projectInvitationsTable.createdAt,
        projectId: projectInvitationsTable.projectId,
        projectTitle: projectsTable.title,
        projectCategory: projectsTable.category,
        projectBudgetMin: projectsTable.budgetMin,
        projectBudgetMax: projectsTable.budgetMax,
        projectStatus: projectsTable.status,
        clientId: projectInvitationsTable.clientId,
        clientName: usersTable.name,
      })
      .from(projectInvitationsTable)
      .innerJoin(projectsTable, eq(projectInvitationsTable.projectId, projectsTable.id))
      .innerJoin(usersTable, eq(projectInvitationsTable.clientId, usersTable.id))
      .where(eq(projectInvitationsTable.freelancerProfileId, profile.id))
      .orderBy(sql`${projectInvitationsTable.createdAt} DESC`);

    res.json(invites);
    return;
  }

  if (role === "client") {
    const invites = await db
      .select({
        id: projectInvitationsTable.id,
        status: projectInvitationsTable.status,
        message: projectInvitationsTable.message,
        createdAt: projectInvitationsTable.createdAt,
        projectId: projectInvitationsTable.projectId,
        projectTitle: projectsTable.title,
        freelancerProfileId: projectInvitationsTable.freelancerProfileId,
        freelancerName: usersTable.name,
        freelancerAvatarUrl: usersTable.avatarUrl,
      })
      .from(projectInvitationsTable)
      .innerJoin(projectsTable, eq(projectInvitationsTable.projectId, projectsTable.id))
      .innerJoin(freelancerProfilesTable, eq(projectInvitationsTable.freelancerProfileId, freelancerProfilesTable.id))
      .innerJoin(usersTable, eq(freelancerProfilesTable.userId, usersTable.id))
      .where(eq(projectInvitationsTable.clientId, userId))
      .orderBy(sql`${projectInvitationsTable.createdAt} DESC`);

    res.json(invites);
    return;
  }

  res.json([]);
});

// PATCH /api/invitations/:id — freelancer accepts or declines
router.patch("/:id", requireAuth, requireRole("freelancer"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status } = req.body as { status: "accepted" | "declined" };
  if (status !== "accepted" && status !== "declined") {
    res.status(400).json({ error: "status must be 'accepted' or 'declined'" });
    return;
  }

  const [profile] = await db
    .select({ id: freelancerProfilesTable.id })
    .from(freelancerProfilesTable)
    .where(eq(freelancerProfilesTable.userId, req.user!.userId));

  if (!profile) { res.status(403).json({ error: "Freelancer profile not found" }); return; }

  const [invite] = await db
    .select()
    .from(projectInvitationsTable)
    .where(and(eq(projectInvitationsTable.id, id), eq(projectInvitationsTable.freelancerProfileId, profile.id)));

  if (!invite) { res.status(404).json({ error: "Invitation not found" }); return; }
  if (invite.status !== "pending") { res.status(400).json({ error: "Invitation is no longer pending" }); return; }

  const [updated] = await db
    .update(projectInvitationsTable)
    .set({ status })
    .where(eq(projectInvitationsTable.id, id))
    .returning();

  // Notify the client
  const [project] = await db
    .select({ title: projectsTable.title })
    .from(projectsTable)
    .where(eq(projectsTable.id, invite.projectId));

  const [freelancerUser] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  await db.insert(notificationsTable).values({
    userId: invite.clientId,
    type: "invitation_response",
    title: status === "accepted" ? "Invitation accepted!" : "Invitation declined",
    message: `${freelancerUser?.name ?? "A freelancer"} ${status === "accepted" ? "accepted" : "declined"} your invitation to "${project?.title ?? "your project"}"`,
    link: `/my-projects`,
  });

  res.json(updated);
});

// GET /api/invitations/check?projectId=X&freelancerProfileId=Y — check if invite exists (for button state)
router.get("/check", requireAuth, requireRole("client"), async (req, res) => {
  const projectId = parseInt(req.query.projectId as string, 10);
  const freelancerProfileId = parseInt(req.query.freelancerProfileId as string, 10);

  if (isNaN(projectId) || isNaN(freelancerProfileId)) {
    res.json({ invited: false });
    return;
  }

  const [existing] = await db
    .select({ id: projectInvitationsTable.id, status: projectInvitationsTable.status })
    .from(projectInvitationsTable)
    .where(
      and(
        eq(projectInvitationsTable.projectId, projectId),
        eq(projectInvitationsTable.freelancerProfileId, freelancerProfileId)
      )
    );

  res.json({ invited: !!existing, status: existing?.status ?? null });
});

export default router;
