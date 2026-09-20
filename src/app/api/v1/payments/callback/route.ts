import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/payments";

/**
 * GET — Razorpay redirect callback (browser flow).
 * Marks the order paid (signature is verified in /verify for the JS flow;
 * this endpoint is the safety net for redirect-based checkouts) and sends
 * the user back to the pricing page.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const orderId = params.get("razorpay_order_id");
  const paymentId = params.get("razorpay_payment_id");
  if (orderId && paymentId) {
    await markOrderPaid(orderId, paymentId);
  }
  return NextResponse.redirect(new URL("/pricing?payment=success", request.url));
}
