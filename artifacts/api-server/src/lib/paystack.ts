import { logger } from "./logger";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE = "https://api.paystack.co";

export const paystackEnabled = !!PAYSTACK_SECRET;

async function request<T = unknown>(method: string, path: string, body?: object): Promise<T> {
  if (!PAYSTACK_SECRET) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured. Add it to your Replit secrets.");
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json() as { status: boolean; message?: string; data: T };
  if (!data.status) throw new Error(data.message ?? "Paystack request failed");
  return data.data;
}

export interface PaystackInitResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializePayment(opts: {
  email: string;
  amountNGN: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResult> {
  return request<PaystackInitResult>("POST", "/transaction/initialize", {
    email: opts.email,
    amount: Math.round(opts.amountNGN * 100), // kobo
    reference: opts.reference,
    callback_url: opts.callbackUrl,
    metadata: opts.metadata ?? {},
  });
}

export interface PaystackVerifyResult {
  status: string; // "success" | "failed" | "abandoned"
  reference: string;
  amount: number; // kobo
  id: number;
  gateway_response: string;
  customer: { email: string };
}

export async function verifyPayment(reference: string): Promise<PaystackVerifyResult> {
  return request<PaystackVerifyResult>("GET", `/transaction/verify/${reference}`);
}

export interface PaystackRefundResult {
  status: string;
  transaction: { id: number; reference: string };
}

export async function initiateRefund(transactionId: string, amountNGN?: number): Promise<PaystackRefundResult> {
  return request<PaystackRefundResult>("POST", "/refund", {
    transaction: transactionId,
    ...(amountNGN !== undefined ? { amount: Math.round(amountNGN * 100) } : {}),
  });
}

export function generateReference(prefix = "SKM"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `INV-${y}${m}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export { logger };
