import { NextRequest, NextResponse } from "next/server";
import {
  activatePlan,
  getUserPlan,
  markOrderPaid,
  verifyRazorpaySignature,
} from "@/lib/payments";
import { createApiKey, validateApiKey } from "@/lib/server-scanner";
import { getUserFromRequest } from "@/lib/auth-server";

/**
 * POST — verify a Razorpay payment and activate the plan.
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *   …or, for ₹0 launch pricing: { order_id, free: true }
 *
 * On success the plan is activated and a fresh API key is generated
 * automatically so the buyer can paste it straight into the CLI.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Sign in to activate a plan" }, { status: 401 });
  }
  try {
    const body = await request.json();

    // ₹0 launch pricing: no real Razorpay payment happens, so the frontend
    // signals a free activation. Skip signature verification for those.
    const isFreeActivation =
      body.free === true || body.razorpay_payment_id === "free_activation";

    if (!isFreeActivation) {
      const ok = verifyRazorpaySignature(
        String(body.razorpay_order_id ?? ""),
        String(body.razorpay_payment_id ?? ""),
        String(body.razorpay_signature ?? "")
      );
      if (!ok) {
        return NextResponse.json({ detail: "Invalid payment signature" }, { status: 400 });
      }
      await markOrderPaid(body.razorpay_order_id, body.razorpay_payment_id);
    }

    const planId = String(body.plan_id ?? "pro");
    await activatePlan(user.id, planId);

    // Auto-generate an API key for this purchase.
    const keyRecord = createApiKey(user.id, `${planId} plan key`);
    const validated = await validateApiKey(keyRecord.full_key ?? "");

    return NextResponse.json({
      success: true,
      plan: await getUserPlan(user.id),
      api_key: {
        name: keyRecord.name,
        key_prefix: keyRecord.key_prefix,
        full_key: keyRecord.full_key,
        validated: Boolean(validated),
      },
      cli_hint: "run: securithm login  → paste this key",
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Payment verification failed";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
