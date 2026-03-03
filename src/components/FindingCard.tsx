"use client";

import type { Finding } from "@/lib/database.types";

const SEVERITY_STYLES: Record<
  Finding["severity"],
  { border: string; text: string; badge: string }
> = {
  critical: {
    border: "border-destructive/60",
    text: "text-destructive",
    badge: "bg-destructive text-white",
  },
  high: {
    border: "border-destructive/40",
    text: "text-destructive/80",
    badge: "bg-destructive/80 text-white",
  },
  medium: {
    border: "border-accent/50",
    text: "text-accent",
    badge: "bg-accent text-black",
  },
  low: {
    border: "border-primary/40",
    text: "text-primary/80",
    badge: "bg-primary/30 text-primary",
  },
  info: {
    border: "border-primary/20",
    text: "text-muted-foreground",
    badge: "bg-primary/10 text-muted-foreground",
  },
};

export function FindingCard({ finding }: { finding: Finding }) {
  const styles = SEVERITY_STYLES[finding.severity];

  return (
    <div className={`p-4 border ${styles.border} bg-black/40`}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`px-2 py-0.5 text-xs font-bold uppercase font-mono ${styles.badge}`}
        >
          {finding.severity}
        </span>
        <span className={`font-bold font-mono text-sm ${styles.text}`}>
          {finding.name}
        </span>
      </div>
      <p className="text-sm text-muted-foreground font-mono">{finding.details}</p>
    </div>
  );
}
