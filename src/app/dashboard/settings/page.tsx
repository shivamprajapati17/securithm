"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  CreditCard,
  Bell,
  Shield,
  Users,
  Palette,
  Webhook,
  Download,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For solo developers exploring AuditAI",
    features: [
      "50 scans/month",
      "Basic monitoring (1 contract)",
      "GitHub Action access",
      "Community support",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "$29",
    description: "For professional teams shipping weekly",
    features: [
      "500 scans/month",
      "10 monitored contracts",
      "AI fix suggestions",
      "Team seats (5 members)",
      "Slack/Discord alerts",
      "Email support",
    ],
    current: false,
  },
  {
    name: "Team",
    price: "$99",
    description: "For protocol teams needing full coverage",
    features: [
      "2,000 scans/month",
      "50 monitored contracts",
      "Remediation workflow",
      "Unlimited team seats",
      "Custom severity thresholds",
      "Priority support",
    ],
    current: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For institutions and high-volume teams",
    features: [
      "Unlimited scans",
      "Unlimited monitoring",
      "Risk Score API access",
      "SOC 2 compliance docs",
      "Dedicated SLAs",
      "99.95% uptime guarantee",
      "Dedicated support",
    ],
    current: false,
  },
];

const notificationSettings = [
  { label: "Scan completed", description: "When a scan finishes processing", enabled: true },
  { label: "Critical finding detected", description: "When a critical severity issue is found", enabled: true },
  { label: "High finding detected", description: "When a high severity issue is found", enabled: true },
  { label: "Monitoring alert", description: "When an on-chain anomaly is detected", enabled: true },
  { label: "Weekly digest", description: "Weekly summary of all activity", enabled: false },
  { label: "SLA breach warning", description: "When a remediation SLA is at risk", enabled: true },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
          Manage your account, billing, and team settings
        </p>
      </div>

      {/* Plan & Billing */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Plan & Billing</CardTitle>
          <Badge variant="secondary" className="gap-1">
            <CreditCard className="h-3 w-3" />
            Free Plan
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-4 rounded-xl border ${
                  plan.current
                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"
                    : "border-surface-200 dark:border-surface-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{plan.name}</h3>
                  {plan.current && (
                    <Badge variant="default" className="text-[10px]">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold mb-1">{plan.price}</div>
                <p className="text-xs text-surface-500 mb-3">
                  {plan.description}
                </p>
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-xs text-surface-600 dark:text-surface-400 flex items-center gap-1.5"
                    >
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.current ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : "Upgrade"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationSettings.map((setting) => (
              <div
                key={setting.label}
                className="flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium">{setting.label}</div>
                  <div className="text-xs text-surface-400">
                    {setting.description}
                  </div>
                </div>
                <Switch defaultChecked={setting.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              icon: Bell,
              name: "Slack",
              description: "Send alerts to a Slack channel",
              connected: true,
            },
            {
              icon: Bell,
              name: "Discord",
              description: "Send alerts to a Discord webhook",
              connected: false,
            },
            {
              icon: Webhook,
              name: "Webhooks",
              description: "Send events to your own endpoints",
              connected: false,
            },
            {
              icon: Download,
              name: "n8n",
              description: "Automate workflows with n8n",
              connected: false,
            },
          ].map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                  <integration.icon className="h-4.5 w-4.5 text-surface-600 dark:text-surface-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">{integration.name}</div>
                  <div className="text-xs text-surface-400">
                    {integration.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {integration.connected && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400"
                  >
                    Connected
                  </Badge>
                )}
                <Button variant="ghost" size="sm">
                  Configure
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5 block">
                Display Name
              </label>
              <Input defaultValue="Solidity Dev" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5 block">
                Email
              </label>
              <Input defaultValue="dev@example.com" type="email" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
