import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: {
    default: "SECURITHM — SMART CONTRACT SECURITY AUDITS",
    template: "%s | SECURITHM",
  },
  description:
    "AI-POWERED SMART CONTRACT SECURITY ANALYSIS. SHIP SECURE CONTRACTS BEFORE THE HACKERS FIND THE BUGS.",
  keywords: [
    "smart contract audit",
    "solidity security",
    "web3 security",
    "smart contract scanner",
    "securithm",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&family=VT323&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased min-h-screen scanlines">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
