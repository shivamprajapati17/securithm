import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  createRazorpayOrder,
  getPlan,
  getUserPlan,
  activatePlan,
  recordOrder,
} from "@/lib/payments";
import { getUserFromRequest } from "@/lib/auth-server";

/**
 * POST { plan_id, billing_cycle } →
 *   already on the plan  → { already_active: true, ... }
 *   amount = 0 (launch)  → plan activated immediately, { payment_required: false }
 *   amount > 0           → Razorpay Checkout payload, { payment_required: true }
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Sign in to purchase a plan" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const plan = getPlan(String(body.plan_id ?? ""));
    if (!plan || plan.id === "free") {
      return NextResponse.json({ detail: "Unknown plan" }, { status: 400 });
    }

    const current = await getUserPlan(user.id);
    if (current.plan_id === plan.id && current.unlimited) {
      return NextResponse.json({
        already_active: true,
        order_id: `active_${plan.id}`,
        amount: plan.amount,
        currency: plan.currency,
        plan_id: plan.id,
        plan_name: plan.name,
        billing_cycle: String(body.billing_cycle ?? "monthly"),
        payment_required: false,
        checkout: null,
      });
    }

    const receipt = `rcpt_${crypto.randomBytes(8).toString("hex")}`;
    const order = await createRazorpayOrder(plan.amount, plan.currency, receipt);
    await recordOrder({
      userId: user.id,
      planId: plan.id,
      amount: plan.amount,
      razorpayOrderId: order?.id ?? null,
    });

    if (!order) {
      // ₹0 launch pricing — no gateway needed; the plan activates immediately.
      await activatePlan(user.id, plan.id);
      return NextResponse.json({
        order_id: receipt,
        amount: 0,
        currency: plan.currency,
        plan_id: plan.id,
        plan_name: plan.name,
        billing_cycle: String(body.billing_cycle ?? "monthly"),
        payment_required: false,
        checkout: null,
      });
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan_id: plan.id,
      plan_name: plan.name,
      billing_cycle: String(body.billing_cycle ?? "monthly"),
      payment_required: true,
      key_id: process.env.RAZORPAY_KEY_ID,
      checkout: { order_id: order.id, amount: order.amount, currency: order.currency },
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
