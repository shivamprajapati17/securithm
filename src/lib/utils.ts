import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "text-severity-critical bg-red-500/10 border-red-500/20";
    case "high":
      return "text-severity-high bg-orange-500/10 border-orange-500/20";
    case "medium":
      return "text-severity-medium bg-yellow-500/10 border-yellow-500/20";
    case "low":
      return "text-severity-low bg-blue-500/10 border-blue-500/20";
    default:
      return "text-severity-info bg-gray-500/10 border-gray-500/20";
  }
}

export function riskScoreColor(grade: string): string {
  const colors: Record<string, string> = {
    A: "text-risk-a bg-green-500/10 border-green-500/20",
    B: "text-risk-b bg-green-400/10 border-green-400/20",
    C: "text-risk-c bg-yellow-500/10 border-yellow-500/20",
    D: "text-risk-d bg-orange-500/10 border-orange-500/20",
    E: "text-risk-e bg-red-500/10 border-red-500/20",
    F: "text-risk-f bg-red-600/10 border-red-600/20",
  };
  return colors[grade.toUpperCase()] ?? colors.F;
}

export function riskScoreLabel(grade: string): string {
  const labels: Record<string, string> = {
    A: "Low Risk",
    B: "Minor Risk",
    C: "Moderate Risk",
    D: "Significant Risk",
    E: "High Risk",
    F: "Critical Risk",
  };
  return labels[grade.toUpperCase()] ?? "Unknown";
}
