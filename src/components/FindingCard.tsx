"use client";

import type { Finding } from "@/lib/database.types";

const SEVERITY_STYLES: Record<
  Finding["severity"],
  { bg: string; border: string; text: string; badge: string }
> = {
  critical: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
    badge: "bg-red-600 text-white",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-800 dark:text-orange-200",
    badge: "bg-orange-600 text-white",
  },
  medium: {
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-800 dark:text-yellow-200",
    badge: "bg-yellow-600 text-white",
  },
  low: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-200",
    badge: "bg-blue-600 text-white",
  },
  info: {
    bg: "bg-zinc-50 dark:bg-zinc-900",
    border: "border-zinc-200 dark:border-zinc-700",
    text: "text-zinc-700 dark:text-zinc-300",
    badge: "bg-zinc-500 text-white",
  },
};

export function FindingCard({ finding }: { finding: Finding }) {
  const styles = SEVERITY_STYLES[finding.severity];

  return (
    <div
      className={`p-4 rounded-lg border ${styles.bg} ${styles.border}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${styles.badge}`}
        >
          {finding.severity}
        </span>
        <span className={`font-semibold ${styles.text}`}>{finding.name}</span>
      </div>
      <p className={`text-sm ${styles.text} opacity-80`}>{finding.details}</p>
    </div>
  );
}
