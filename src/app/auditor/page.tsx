"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useChain } from "@/lib/chain/context";

// Conditionally import wagmi hooks — only used when Base is selected
let useAccount: () => { address?: string; isConnected: boolean };
let useSignMessage: () => { signMessageAsync: (args: { message: string }) => Promise<string> };
let ConnectButton: React.ComponentType;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const wagmi = require("wagmi");
  useAccount = wagmi.useAccount;
  useSignMessage = wagmi.useSignMessage;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const rainbowkit = require("@rainbow-me/rainbowkit");
  ConnectButton = rainbowkit.ConnectButton;
} catch {
  // wagmi not available — Base disabled
  useAccount = () => ({ address: undefined, isConnected: false });
  useSignMessage = () => ({ signMessageAsync: async () => "" });
  ConnectButton = () => null;
}

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
  const { chain, baseEnabled } = useChain();

  // Solana wallet
  const { publicKey, signMessage: solanaSignMessage, connected: solanaConnected } = useWallet();
  const solanaAddress = publicKey?.toBase58() ?? "";

  // Base wallet (only active when Base is enabled)
  const baseAccount = baseEnabled ? useAccount() : { address: undefined, isConnected: false };
  const baseSignMessage = baseEnabled ? useSignMessage() : { signMessageAsync: async () => "" };
  const baseAddress = baseAccount.address ?? "";
  const baseConnected = baseAccount.isConnected;

  // Derive active wallet from selected chain
  const walletAddress = chain === "base" ? baseAddress : solanaAddress;
  const isConnected = chain === "base" ? baseConnected : solanaConnected;

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitScore, setSubmitScore] = useState("");
  const [submitReport, setSubmitReport] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const res = await fetch(
        `/api/auditor/dashboard?wallet=${encodeURIComponent(walletAddress)}`
      );
      const data = await res.json();
      if (res.ok) setDashboard(data);
    } catch {
      // Ignore — auditor may not exist yet
    }
  }, [walletAddress]);

  // Auto-load dashboard when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress) {
      loadDashboard();
    } else {
      setDashboard(null);
    }
  }, [isConnected, walletAddress, loadDashboard]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;
    setLoading(true);
    setMessage(null);

    try {
      const timestamp = Date.now();
      const msg = `Vigil Protocol auditor registration: ${walletAddress}:${timestamp}`;
      let signature: string;

      if (chain === "base") {
        // EIP-191 signing via wagmi
        signature = await baseSignMessage.signMessageAsync({ message: msg });
      } else {
        // Ed25519 signing via Solana wallet adapter
        if (!solanaSignMessage) throw new Error("Wallet does not support signing");
        const messageBytes = new TextEncoder().encode(msg);
        const signatureBytes = await solanaSignMessage(messageBytes);
        const bs58 = (await import("bs58")).default;
        signature = bs58.encode(signatureBytes);
      }

      const res = await fetch("/api/auditor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          signature,
          message: msg,
          timestamp,
          chain,
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

  const handleSubmitAudit = async (assignmentId: string) => {
    setSubmitLoading(true);
    setSubmitMessage(null);

    try {
      const res = await fetch("/api/audit/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          walletAddress,
          score: Number(submitScore),
          report: submitReport,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSubmitMessage(
        data.consensus
          ? `Submitted! Consensus resolved: score ${data.consensus.finalScore}, agreement ${data.consensus.agreement}`
          : "Audit submitted — awaiting other auditors."
      );
      setSubmittingId(null);
      setSubmitScore("");
      setSubmitReport("");
      loadDashboard();
    } catch (err) {
      setSubmitMessage(
        err instanceof Error ? err.message : "Submission failed"
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen selection:bg-primary selection:text-primary-foreground">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-bold mb-2">BECOME AN AUDITOR</h1>
        <p className="text-muted-foreground font-mono mb-8">
          Stake tokens, verify AI skills, and earn fees for every scan.
        </p>

        {/* Registration form */}
        <form
          onSubmit={handleRegister}
          className="p-6 border border-primary/30 bg-card mb-8"
        >
          <h2 className="text-lg font-bold mb-4">REGISTER AS AUDITOR</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-2">
                Connect Wallet {chain === "base" && baseEnabled ? "(Base)" : "(Solana)"}
              </label>
              {chain === "base" && baseEnabled ? (
                <div>
                  {ConnectButton && <ConnectButton />}
                  {baseConnected && baseAddress && (
                    <p className="text-xs text-primary/60 font-mono mt-2 truncate">
                      {baseAddress}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <WalletMultiButton
                    style={{
                      backgroundColor: "transparent",
                      border: "2px solid rgba(0, 255, 0, 0.5)",
                      color: "rgb(0, 255, 0)",
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      height: "auto",
                      padding: "0.75rem 1rem",
                    }}
                  />
                  {solanaConnected && solanaAddress && (
                    <p className="text-xs text-primary/60 font-mono mt-2 truncate">
                      {solanaAddress}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              <p className="mb-1">
                Your tier is determined by your staked token balance:
              </p>
              <div className="flex gap-4">
                <span className="text-amber-600">Bronze: 1,000</span>
                <span className="text-zinc-400">Silver: 5,000</span>
                <span className="text-yellow-500">Gold: 25,000</span>
                <span className="text-cyan-400">Platinum: 100,000</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !isConnected}
              className="brutal-border bg-primary text-black font-display font-bold text-sm px-6 py-3 uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
            >
              {loading ? "SIGNING..." : "[ SIGN & REGISTER ]"}
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
                    <div key={a.id} className="border border-primary/20">
                      <div className="flex items-center justify-between p-3 bg-black/40">
                        <div>
                          <p className="text-sm font-mono text-primary/80 truncate max-w-md">
                            {a.skill_url}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {new Date(a.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(a.status === "assigned" || a.status === "in_progress") && (
                            <button
                              onClick={() => {
                                setSubmittingId(submittingId === a.id ? null : a.id);
                                setSubmitScore("");
                                setSubmitReport("");
                                setSubmitMessage(null);
                              }}
                              className="brutal-border bg-primary text-black font-display font-bold text-xs px-3 py-1 uppercase cursor-pointer hover:bg-primary/80 transition-colors"
                            >
                              {submittingId === a.id ? "[ CANCEL ]" : "[ SUBMIT AUDIT ]"}
                            </button>
                          )}
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
                      </div>

                      {submittingId === a.id && (
                        <div className="p-4 border-t border-primary/20 bg-black/60 space-y-3">
                          <div>
                            <label className="block text-xs font-mono text-muted-foreground mb-1">
                              Security Score (0-100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={submitScore}
                              onChange={(e) => setSubmitScore(e.target.value)}
                              placeholder="75"
                              className="w-full px-4 py-2 bg-black border-2 border-primary/50 text-primary font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all placeholder:text-primary/30"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-mono text-muted-foreground mb-1">
                              Audit Report
                            </label>
                            <textarea
                              value={submitReport}
                              onChange={(e) => setSubmitReport(e.target.value)}
                              placeholder="Describe your findings, vulnerabilities discovered, and reasoning for the score..."
                              rows={4}
                              className="w-full px-4 py-2 bg-black border-2 border-primary/50 text-primary font-mono text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all placeholder:text-primary/30 resize-y"
                              required
                            />
                          </div>
                          <button
                            onClick={() => handleSubmitAudit(a.id)}
                            disabled={submitLoading || !submitScore || !submitReport}
                            className="brutal-border bg-primary text-black font-display font-bold text-xs px-4 py-2 uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
                          >
                            {submitLoading ? "SUBMITTING..." : "[ CONFIRM SUBMISSION ]"}
                          </button>
                          {submitMessage && (
                            <p className="text-xs font-mono text-primary/80">
                              {submitMessage}
                            </p>
                          )}
                        </div>
                      )}
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
