import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: {
    default: "AuditAI — Smart Contract Security, Architecturally Sharp",
    template: "%s | AuditAI",
  },
  description:
    "AI-powered smart contract security audits. Static analysis, symbolic execution and AI reasoning — ship secure contracts before the hackers find the bugs.",
  keywords: [
    "smart contract audit",
    "solidity security",
    "web3 security",
    "smart contract scanner",
    "auditai",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700&family=Archivo+Black&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
