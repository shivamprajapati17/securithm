import { NextResponse } from "next/server";

/** Plan catalog for the pricing/dashboard billing views. */
const PLANS = [
  {
    id: "free",
    name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    scans_per_month: 5,
    features: [
      "5 contract scans / month",
      "11 trained security agents",
      "Auto-fix patches & fixed contracts",
      "CLI access (securithm)",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price_monthly: 49,
    price_yearly: 470,
    scans_per_month: 500,
    features: [
      "500 contract scans / month",
      "Everything in Free",
      "Dashboard sync from CLI & SDK",
      "Unlimited API keys",
      "Team workspaces",
      "Priority support",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price_monthly: null,
    price_yearly: null,
    scans_per_month: null,
    features: [
      "Unlimited scans",
      "Everything in Pro",
      "Solvency proofs & on-chain attestations",
      "Custom agent rules",
      "SLA & dedicated support",
    ],
    highlight: false,
  },
];

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}
