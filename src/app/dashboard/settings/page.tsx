"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  Bell,
  Webhook,
  Download,
  ChevronRight,
} from "lucide-react";

const plans = [
  {
    name: "FREE",
    price: "$0",
    description: "FOR SOLO DEVELOPERS EXPLORING SECURITHM",
    features: [
      "50 SCANS/MONTH",
      "BASIC MONITOR (1 CONTRACT)",
      "GITHUB ACTION ACCESS",
      "COMMUNITY SUPPORT",
    ],
    current: true,
  },
  {
    name: "PRO",
    price: "$29",
    description: "FOR PROFESSIONAL TEAMS SHIPPING WEEKLY",
    features: [
      "500 SCANS/MONTH",
      "10 MONITORED CONTRACTS",
      "AI FIX SUGGESTIONS",
      "TEAM SEATS (5 MEMBERS)",
      "SLACK/DISCORD ALERTS",
      "EMAIL SUPPORT",
    ],
    current: false,
  },
  {
    name: "TEAM",
    price: "$99",
    description: "FOR PROTOCOL TEAMS NEEDING FULL COVERAGE",
    features: [
      "2,000 SCANS/MONTH",
      "50 MONITORED CONTRACTS",
      "REMEDIATION WORKFLOW",
      "UNLIMITED TEAM SEATS",
      "CUSTOM THRESHOLDS",
      "PRIORITY SUPPORT",
    ],
    current: false,
  },
  {
    name: "ENTERPRISE",
    price: "CUSTOM",
    description: "FOR INSTITUTIONS AND HIGH-VOLUME TEAMS",
    features: [
      "UNLIMITED SCANS",
      "UNLIMITED MONITORING",
      "RISK SCORE API ACCESS",
      "SOC 2 COMPLIANCE DOCS",
      "DEDICATED SLAS",
      "99.95% UPTIME GUARANTEE",
      "DEDICATED SUPPORT",
    ],
    current: false,
  },
];

const notificationSettings = [
  { label: "SCAN_COMPLETED", description: "WHEN A SCAN FINISHES PROCESSING", enabled: true },
  { label: "CRITICAL_FINDING", description: "WHEN A CRITICAL SEVERITY ISSUE IS FOUND", enabled: true },
  { label: "HIGH_FINDING", description: "WHEN A HIGH SEVERITY ISSUE IS FOUND", enabled: true },
  { label: "MONITOR_ALERT", description: "WHEN AN ON-CHAIN ANOMALY IS DETECTED", enabled: true },
  { label: "WEEKLY_DIGEST", description: "WEEKLY SUMMARY OF ALL ACTIVITY", enabled: false },
  { label: "SLA_BREACH", description: "WHEN A REMEDIATION SLA IS AT RISK", enabled: true },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
          SETTINGS CONFIGURATION
        </h1>
        <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
          MANAGE YOUR ACCOUNT, BILLING, AND TEAM SETTINGS
        </p>
      </div>

      {/* Plan & Billing */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{">"} PLAN_BILLING</CardTitle>
          <Badge variant="default" className="gap-1 text-[9px]">
            <CreditCard className="h-2.5 w-2.5" />
            [FREE]
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-3 border ${
                  plan.current
                    ? "border-[var(--color-term-fg)] bg-[var(--color-term-dim)]"
                    : "border-[var(--color-term-border)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-[11px] font-bold text-[var(--color-term-fg)] font-mono">{plan.name}</h3>
                  {plan.current && (
                    <Badge variant="default" className="text-[8px] px-1">
                      [CURRENT]
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-bold text-[var(--color-term-fg)] term-glow mb-1">{plan.price}</div>
                <p className="text-[9px] text-[var(--color-term-muted)] mb-2 font-mono">
                  {plan.description}
                </p>
                <ul className="space-y-1 mb-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-[8px] text-[var(--color-term-muted)] font-mono flex items-center gap-1"
                    >
                      <span className="text-[var(--color-term-fg)]">+</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.current ? "outline" : "default"}
                  size="sm"
                  className="w-full text-[9px] h-7"
                  disabled={plan.current}
                >
                  {plan.current ? "[CURRENT]" : "[ UPGRADE ]"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} NOTIFICATIONS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notificationSettings.map((setting) => (
              <div
                key={setting.label}
                className="flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] font-mono text-[var(--color-term-fg)] font-bold uppercase">{setting.label}</div>
                  <div className="text-[9px] text-[var(--color-term-muted)] font-mono">
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
          <CardTitle>{">"} INTEGRATIONS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              icon: Bell,
              name: "SLACK",
              description: "SEND ALERTS TO A SLACK CHANNEL VIA INCOMING WEBHOOK",
              connected: true,
              setupSteps: [
                "CREATE A SLACK APP AT api.slack.com/apps",
                "ENABLE INCOMING WEBHOOKS AND CREATE A WEBHOOK URL",
                "PASTE THE WEBHOOK URL IN THE CONFIGURATION FIELD",
                "SELECT THE CHANNEL FOR SECURITY ALERTS",
              ],
            },
            {
              icon: Bell,
              name: "DISCORD",
              description: "SEND ALERTS TO A DISCORD CHANNEL VIA WEBHOOK",
              connected: false,
              setupSteps: [
                "GO TO DISCORD SERVER SETTINGS > INTEGRATIONS",
                "CREATE A NEW WEBHOOK AND COPY THE URL",
                "PASTE THE WEBHOOK URL IN THE CONFIGURATION FIELD",
                "SELECT THE SEVERITY THRESHOLD FOR NOTIFICATIONS",
              ],
            },
            {
              icon: Webhook,
              name: "WEBHOOKS",
              description: "SEND EVENTS TO YOUR OWN CUSTOM ENDPOINTS",
              connected: false,
              setupSteps: [
                "PROVIDE YOUR HTTPS ENDPOINT URL",
                "SELECT WHICH EVENT TYPES TO RECEIVE",
                "SECURITHM WILL POST JSON PAYLOADS",
                "TEST THE WEBHOOK WITH A SAMPLE EVENT",
              ],
            },
            {
              icon: Download,
              name: "N8N",
              description: "AUTOMATE WORKFLOWS WITH N8N.IO",
              connected: false,
              setupSteps: [
                "INSTALL N8N WORKFLOW AUTOMATION",
                "ADD THE SECURITHM WEBHOOK NODE",
                "CONFIGURE TRIGGER EVENTS FOR SCANS AND ALERTS",
                "AUTOMATE TICKETING, NOTIFICATIONS, AND REPORTING",
              ],
            },
          ].map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-2.5 border border-[var(--color-term-border)]"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center border border-[var(--color-term-border)] text-[var(--color-term-fg)]">
                  <integration.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[var(--color-term-fg)] font-bold uppercase">{integration.name}</div>
                  <div className="text-[8px] text-[var(--color-term-muted)] font-mono">
                    {integration.description}
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    {integration.setupSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-1 text-[8px] text-[var(--color-term-muted)] font-mono">
                        <span className="text-[var(--color-term-fg)] shrink-0">{i + 1}.</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {integration.connected && (
                  <Badge variant="default" className="text-[8px] px-1 bg-[var(--color-term-fg)] text-[var(--color-term-bg)]">
                    [OK]
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="text-[9px] h-6">
                  CONFIG
                  <ChevronRight className="h-3 w-3" />
                </Button>
                {!integration.connected && (
                  <Button variant="outline" size="sm" className="text-[8px] h-5">
                    [ SETUP GUIDE ]
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} PROFILE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block">
                DISPLAY NAME
              </label>
              <div className="flex items-center border border-[var(--color-term-border)] px-2">
                <input
                  id="settings-display-name"
                  name="display_name"
                  defaultValue="Solidity Dev"
                  className="flex-1 bg-transparent border-none outline-none text-[var(--color-term-fg)] font-mono text-xs py-1.5"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block" htmlFor="settings-email">
                EMAIL
              </label>
              <div className="flex items-center border border-[var(--color-term-border)] px-2">
                <input
                  id="settings-email"
                  name="email"
                  defaultValue="dev@example.com"
                  type="email"
                  className="flex-1 bg-transparent border-none outline-none text-[var(--color-term-fg)] font-mono text-xs py-1.5"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm">[ SAVE ]</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
