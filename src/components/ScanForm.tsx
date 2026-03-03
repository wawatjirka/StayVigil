"use client";

import { useState } from "react";
import { Terminal, ChevronRight, Activity } from "lucide-react";
import type { Finding } from "@/lib/database.types";
import { FindingCard } from "./FindingCard";
import { ScoreBadge } from "./ScoreBadge";

interface ScanResult {
  skillId?: string;
  skillName: string;
  skillUrl: string;
  score: number;
  report: string;
  findings: Finding[];
  scannedAt: string;
  cached?: boolean;
  tier?: string;
  note?: string;
}

export function ScanForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillUrl: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Scan failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const failedFindings = result?.findings.filter((f) => !f.passed) || [];
  const passedFindings = result?.findings.filter((f) => f.passed) || [];

  return (
    <div className="w-full max-w-3xl">
      {/* Search bar */}
      <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste GitHub repo or skill URL..."
            className="w-full bg-black border-2 border-primary/50 text-primary px-10 py-4 font-mono focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all placeholder:text-primary/30"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="brutal-border bg-primary text-black font-display font-bold text-xl px-8 py-4 uppercase flex items-center justify-center gap-2 min-w-[160px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Activity className="animate-spin w-5 h-5" /> SCANNING
            </>
          ) : (
            <>
              SCAN <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-16">
          <div className="relative inline-block">
            <div className="w-12 h-12 border-4 border-primary/20" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-primary mt-4 font-mono font-bold uppercase tracking-wider">
            Analyzing skill for security vulnerabilities...
          </p>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            Static analysis + AI review. This may take 15-30 seconds.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-6 p-4 border-2 border-destructive bg-destructive/10 flex items-start gap-3">
          <span className="text-destructive text-lg leading-none mt-0.5 font-bold">
            !
          </span>
          <div>
            <p className="font-bold text-destructive text-sm uppercase tracking-wider">
              Scan failed
            </p>
            <p className="text-destructive/80 text-sm mt-0.5 font-mono">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6 animate-[fadeIn_0.3s_ease-out]">
          {/* Score header */}
          <div className="flex items-center justify-between p-6 border border-primary/30 bg-card">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-primary truncate font-display uppercase tracking-wider">
                {result.skillName}
              </h2>
              <p className="text-sm text-muted-foreground font-mono mt-1 truncate">
                {result.skillUrl}
              </p>
              <div className="flex items-center gap-3 mt-2">
                {result.cached && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-primary/30 text-xs text-muted-foreground font-mono">
                    CACHED
                  </span>
                )}
                {result.tier === "free" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-accent/50 text-xs text-accent font-mono">
                    FREE TIER (TOP 3)
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(result.scannedAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="ml-4 shrink-0">
              <ScoreBadge score={result.score} />
            </div>
          </div>

          {/* Failed findings */}
          {failedFindings.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-destructive uppercase tracking-wider mb-3 font-display">
                Issues Found ({failedFindings.length})
              </h3>
              <div className="space-y-3">
                {failedFindings.map((f, i) => (
                  <FindingCard key={i} finding={f} />
                ))}
              </div>
            </div>
          )}

          {/* Passed checks */}
          {passedFindings.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 font-display">
                Passed Checks ({passedFindings.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {passedFindings.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 border border-primary/30 bg-primary/5 text-sm"
                  >
                    <span className="w-5 h-5 bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      &#10003;
                    </span>
                    <span className="font-mono text-primary/80 text-xs truncate">
                      {f.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
