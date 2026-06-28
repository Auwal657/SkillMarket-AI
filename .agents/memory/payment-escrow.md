---
name: Payment & Escrow System
description: Architecture and key decisions for the Paystack-based escrow payment system
---

## Architecture

**DB tables (lib/db/src/schema/):**
- `wallets` — one per user, `balance` numeric(14,2) NGN
- `escrow_transactions` — one per project, tracks full Paystack lifecycle
- `wallet_transactions` — immutable ledger entries (credit/debit)
- `withdrawal_requests` — freelancer bank withdrawal requests
- `invoices` — receipts tied to escrow events

**Backend (artifacts/api-server/src/routes/):**
- `payments.ts` — initialize, verify, release, refund escrow; exports `releaseEscrow()` and `getOrCreateWallet()`
- `wallet.ts` — wallet summary, transaction history, withdrawals, invoices

**Frontend (artifacts/skillmarket/src/pages/):**
- `WalletPage.tsx` — tabbed: overview / transactions / withdrawals / invoices
- `PaymentCallbackPage.tsx` — `/payment/callback` handles Paystack redirect
- `InvoicePage.tsx` — `/invoices/:id` printable receipt
- `EscrowPanel.tsx` (component) — embedded in ProjectDetailPage sidebar

## Key Decisions

**Amounts:** always stored as `numeric(14,2)` strings in DB. Parse with `parseFloat()` before arithmetic. Paystack receives kobo (NGN × 100), returns kobo.

**Dev mode:** if `PAYSTACK_SECRET_KEY` is absent, initialize returns `devMode: true` + reference. EscrowPanel auto-calls verify with the reference to simulate funding in-browser without real payment.

**Escrow lifecycle:** pending → in_escrow (on verify) → released (auto on project complete, or manual). Auto-release fires in `projects.ts` `PATCH /:id/complete` via `releaseEscrow(id).catch(() => {})`.

**Wallet debits:** client wallet goes negative on escrow fund (they paid Paystack directly). This is intentional — their actual balance isn't the payment source. Freelancer wallet only receives credits on release.

**Withdrawal hold:** amount is immediately deducted from freelancer wallet on request submission. If admin rejects, funds are credited back.

**Why:**
- One escrow per project (enforced by unique constraint on `projectId`)
- Admin refund endpoint at `POST /api/payments/refund/:projectId` works for both admin and client
- Admin withdrawal management at `PATCH /api/admin/payments/withdrawals/:id`
