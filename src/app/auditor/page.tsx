"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface AuditorData {
  wallet_address: string;
  stake_amount: number;
  tier: string;
  reputation_score: number;
  total_audits: number;
  active: boolean;
}

interface DashboardData {
  auditor: AuditorData;
  activeAudits: number;
  completedAudits: number;
  recentAssignments: Array<{
    id: string;
    skill_url: string;
    status: string;
    score: number | null;
    assigned_at: string;
  }>;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-zinc-400",
  gold: "text-yellow-500",
  platinum: "text-cyan-400",
};

export default function AuditorPage() {
  const [wallet, setWallet] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auditor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: wallet,
          stakeAmount: Number(stakeAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Registration successful!");
      loadDashboard();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    if (!wallet) return;
    try {
      const res = await fetch(
        `/api/auditor/dashboard?wallet=${encodeURIComponent(wallet)}`
      );
      const data = await res.json();
      if (res.ok) setDashboard(data);
    } catch {
      // Ignore — auditor may not exist yet
    }
  };

  return (
    <div className="min-h-screen selection:bg-primary selection:text-primary-foreground">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-bold mb-2">BECOME AN AUDITOR</h1>
        <p className="text-muted-foreground font-mono mb-8">
          Stake $VIGIL tokens, verify AI skills, and earn fees for every scan.
        </p>

        {/* Registration form */}
        <form
          onSubmit={handleRegister}
          className="p-6 border border-primary/30 bg-card mb-8"
        >
          <h2 className="text-lg font-bold mb-4">REGISTER AS AUDITOR</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-1">
                Wallet Address
              </label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-black border-2 border-primary/50 text-primary font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all placeholder:text-primary/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-1">
                Stake Amount ($VIGIL)
              </label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="1000"
                min="1000"
                className="w-full px-4 py-3 bg-black border-2 border-primary/50 text-primary font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all placeholder:text-primary/30"
                required
              />
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Minimum 1,000 $VIGIL (Bronze tier). Higher stakes unlock more
                audit types.
              </p>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground font-mono">
              <span className="text-amber-600">Bronze: 1,000</span>
              <span className="text-zinc-400">Silver: 5,000</span>
              <span className="text-yellow-500">Gold: 25,000</span>
              <span className="text-cyan-400">Platinum: 100,000</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="brutal-border bg-primary text-black font-display font-bold text-sm px-6 py-3 uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
            >
              {loading ? "REGISTERING..." : "[ REGISTER & STAKE ]"}
            </button>
          </div>
          {message && (
            <p className="mt-3 text-sm font-mono text-primary/80">{message}</p>
          )}
        </form>

        {/* Dashboard */}
        {dashboard && (
          <div className="space-y-6">
            <div className="p-6 border border-primary/30">
              <h2 className="text-lg font-bold mb-4">DASHBOARD</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground font-mono">
                    Tier
                  </p>
                  <p
                    className={`text-xl font-bold font-display uppercase ${TIER_COLORS[dashboard.auditor.tier] || "text-primary"}`}
                  >
                    {dashboard.auditor.tier}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-mono">
                    Reputation
                  </p>
                  <p className="text-xl font-bold text-primary font-mono">
                    {dashboard.auditor.reputation_score}/100
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-mono">
                    Active
                  </p>
                  <p className="text-xl font-bold text-primary font-mono">
                    {dashboard.activeAudits}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-mono">
                    Completed
                  </p>
                  <p className="text-xl font-bold text-primary font-mono">
                    {dashboard.completedAudits}
                  </p>
                </div>
              </div>
            </div>

            {dashboard.recentAssignments.length > 0 && (
              <div className="p-6 border border-primary/30">
                <h3 className="text-lg font-bold mb-4">
                  RECENT ASSIGNMENTS
                </h3>
                <div className="space-y-3">
                  {dashboard.recentAssignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 bg-black/40 border border-primary/20"
                    >
                      <div>
                        <p className="text-sm font-mono text-primary/80 truncate max-w-md">
                          {a.skill_url}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {new Date(a.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 font-bold font-mono uppercase ${
                          a.status === "completed"
                            ? "bg-primary/20 text-primary border border-primary/40"
                            : a.status === "disputed"
                              ? "bg-destructive/20 text-destructive border border-destructive/40"
                              : "bg-accent/20 text-accent border border-accent/40"
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
