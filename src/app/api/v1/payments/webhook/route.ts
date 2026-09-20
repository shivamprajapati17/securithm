import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markOrderPaid, activatePlan } from "@/lib/payments";

/**
 * POST — Razorpay webhook (payment.captured events).
 * Verifies X-Razorpay-Signature against RAZORPAY_WEBHOOK_SECRET when set,
 * then marks the order paid and activates the buyer's plan.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret) {
      const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
      const valid =
        expected.length === signature.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
      if (!valid) {
        return NextResponse.json({ detail: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(raw);
    if (event?.event === "payment.captured") {
      const entity = event.payload?.payment?.entity ?? {};
      const notes = entity.notes ?? {};
      const orderId = entity.order_id ?? null;
      const userId = String(notes.user_id ?? "");
      const planId = String(notes.plan_id ?? "pro");
      if (orderId) await markOrderPaid(orderId, entity.id ?? null);
      if (userId) await activatePlan(userId, planId);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
