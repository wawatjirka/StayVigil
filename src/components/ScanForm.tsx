"use client";

import { useState } from "react";
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
    <div className="w-full max-w-3xl mx-auto">
      {/* Search bar */}
      <form onSubmit={handleScan} className="relative">
        <div className="flex gap-2 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg shadow-zinc-200/50 dark:shadow-zinc-900/50">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/user/skill-repo"
            className="flex-1 px-4 py-3 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none font-mono text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:from-zinc-400 disabled:to-zinc-500 text-white font-medium transition-all cursor-pointer disabled:cursor-not-allowed text-sm shadow-sm"
          >
            {loading ? "Scanning..." : "Scan"}
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-16">
          <div className="relative inline-block">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-200 dark:border-zinc-700" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-zinc-500 mt-4 font-medium">
            Analyzing skill for security vulnerabilities...
          </p>
          <p className="text-zinc-400 text-sm mt-1">
            Static analysis + AI review. This may take 15-30 seconds.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <span className="text-red-500 text-lg leading-none mt-0.5">!</span>
          <div>
            <p className="font-medium text-red-800 dark:text-red-200 text-sm">
              Scan failed
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-0.5">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6 animate-[fadeIn_0.3s_ease-out]">
          {/* Score header */}
          <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {result.skillName}
              </h2>
              <p className="text-sm text-zinc-500 font-mono mt-1 truncate">
                {result.skillUrl}
              </p>
              <div className="flex items-center gap-3 mt-2">
                {result.cached && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">
                    Cached
                  </span>
                )}
                {result.tier === "free" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs text-blue-600 dark:text-blue-400">
                    Free tier (top 3 findings)
                  </span>
                )}
                <span className="text-xs text-zinc-400">
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
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
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
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Passed Checks ({passedFindings.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {passedFindings.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 text-sm"
                  >
                    <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 flex items-center justify-center text-xs">
                      &#10003;
                    </span>
                    <span className="font-medium text-green-800 dark:text-green-300 text-xs truncate">
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
