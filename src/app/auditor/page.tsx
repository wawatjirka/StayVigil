"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldLogo } from "@/components/ShieldLogo";

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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <div className="flex items-center gap-3 mb-2">
          <ShieldLogo size={28} />
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Become an Auditor
          </h1>
        </div>
        <p className="text-zinc-500 mb-8">
          Stake $VIGIL tokens, verify AI skills, and earn fees for every scan.
        </p>

        {/* Registration form */}
        <form
          onSubmit={handleRegister}
          className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 mb-8"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Register as Auditor
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Wallet Address
              </label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Stake Amount ($VIGIL)
              </label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="1000"
                min="1000"
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                required
              />
              <p className="text-xs text-zinc-400 mt-1">
                Minimum 1,000 $VIGIL (Bronze tier). Higher stakes unlock more
                audit types.
              </p>
            </div>
            <div className="flex gap-4 text-sm text-zinc-500">
              <span>Bronze: 1,000</span>
              <span>Silver: 5,000</span>
              <span>Gold: 25,000</span>
              <span>Platinum: 100,000</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:from-zinc-500 disabled:to-zinc-500 text-white font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Register & Stake"}
            </button>
          </div>
          {message && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {message}
            </p>
          )}
        </form>

        {/* Dashboard */}
        {dashboard && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Dashboard
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Tier</p>
                  <p
                    className={`text-xl font-bold capitalize ${TIER_COLORS[dashboard.auditor.tier] || ""}`}
                  >
                    {dashboard.auditor.tier}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Reputation</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {dashboard.auditor.reputation_score}/100
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Active Audits</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {dashboard.activeAudits}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Completed</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {dashboard.completedAudits}
                  </p>
                </div>
              </div>
            </div>

            {dashboard.recentAssignments.length > 0 && (
              <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Recent Assignments
                </h3>
                <div className="space-y-3">
                  {dashboard.recentAssignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800"
                    >
                      <div>
                        <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-md">
                          {a.skill_url}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(a.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          a.status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : a.status === "disputed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
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
