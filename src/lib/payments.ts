/**
 * Payments — Razorpay order creation, signature verification and plan
 * activation. Amounts come from PLANS; with the current launch pricing
 * everything is ₹0, so activation is free and the Razorpay Checkout path
 * activates automatically the moment a real price is configured.
 */

import crypto from "crypto";

export interface PlanDef {
  id: string;
  name: string;
  /** Amount in paise. 0 = free activation (no gateway). */
  amount: number;
  currency: string;
  description: string;
}

export const PLANS: PlanDef[] = [
  { id: "free", name: "Developer Free", amount: 0, currency: "INR", description: "5 scans, agent engine, CLI" },
  { id: "pro", name: "Securithm Pro", amount: 0, currency: "INR", description: "Unlimited scans, dashboard sync, API keys" },
  { id: "enterprise", name: "API & Enterprise", amount: 0, currency: "INR", description: "High-throughput API, monitoring, solvency suite" },
];

export function getPlan(planId: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === planId);
}

export const FREE_SCAN_LIMIT = 5;

function admin() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/** Create a Razorpay order (test/live per key id). Returns null on config/free paths. */
export async function createRazorpayOrder(
  amount: number,
  currency: string,
  receipt: string
): Promise<RazorpayOrder | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || amount <= 0) return null;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency, receipt, payment_capture: 1 }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** HMAC-SHA256(order_id|payment_id, secret) == signature */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function recordOrder(input: {
  userId: string;
  planId: string;
  amount: number;
  razorpayOrderId: string | null;
}): Promise<void> {
  const sb = admin();
  if (!sb) return;
  try {
    await (sb.from("payment_orders") as unknown as {
      insert: (r: unknown) => PromiseLike<{ error: unknown }>;
    }).insert({
      user_id: input.userId,
      plan_id: input.planId,
      amount: input.amount,
      currency: "INR",
      status: "created",
      razorpay_order_id: input.razorpayOrderId,
    });
  } catch {
    /* memory-only fallback: activation still works */
  }
}

export async function markOrderPaid(
  razorpayOrderId: string | null,
  paymentId: string | null
): Promise<void> {
  const sb = admin();
  if (!sb || !razorpayOrderId) return;
  try {
    await (sb.from("payment_orders") as unknown as {
      update: (r: unknown) => { eq: (c: string, v: unknown) => PromiseLike<{ error: unknown }> };
    }).update({ status: "paid", razorpay_payment_id: paymentId, paid_at: new Date().toISOString() })
      .eq("razorpay_order_id", razorpayOrderId);
  } catch {
    /* ignore */
  }
}

export async function activatePlan(userId: string, planId: string): Promise<void> {
  const sb = admin();
  if (!sb) return;
  try {
    await (sb.from("user_plans") as unknown as {
      upsert: (r: unknown) => PromiseLike<{ error: unknown }>;
    }).upsert({
      user_id: userId,
      plan_id: planId,
      unlimited: planId !== "free",
      updated_at: new Date().toISOString(),
    });
  } catch {
    /* ignore */
  }
}

export interface UserPlan {
  plan_id: string;
  unlimited: boolean;
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const sb = admin();
  if (!sb) return { plan_id: "free", unlimited: false };
  try {
    const { data, error } = (await (sb.from("user_plans") as unknown as {
      select: (s: string) => { eq: (c: string, v: unknown) => PromiseLike<{ data: unknown[] | null; error: unknown }> };
    }).select("*").eq("user_id", userId)) as unknown as { data: Array<Record<string, unknown>> | null; error: unknown };
    if (error || !data || data.length === 0) return { plan_id: "free", unlimited: false };
    return {
      plan_id: String(data[0].plan_id ?? "free"),
      unlimited: Boolean(data[0].unlimited),
    };
  } catch {
    return { plan_id: "free", unlimited: false };
  }
}
