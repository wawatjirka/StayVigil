import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          API Documentation
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-10">
          Integrate Vigil into your agent pipeline. Scan skills programmatically before installing them.
        </p>

        {/* Free Scan */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              FREE
            </span>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              POST /api/scan
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Free scan with Llama 3.3 70B analysis. Rate limited to 10 scans/day per IP. Returns top 3 findings.
          </p>
          <div className="rounded-lg bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 p-4 mb-4 overflow-x-auto">
            <pre className="text-sm text-zinc-300">
              <code>{`curl -X POST https://vigil-protocol.vercel.app/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"skillUrl": "https://github.com/user/repo/blob/main/SKILL.md"}'`}</code>
            </pre>
          </div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Response</h3>
          <div className="rounded-lg bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 p-4 overflow-x-auto">
            <pre className="text-sm text-zinc-300">
              <code>{`{
  "skillId": "uuid",
  "skillName": "My Skill",
  "skillUrl": "https://...",
  "score": 72,
  "findings": [
    {
      "name": "[AI] Hidden Instructions",
      "severity": "high",
      "passed": false,
      "details": "Found instructions attempting to override system prompt..."
    }
  ],
  "scannedAt": "2026-03-03T...",
  "tier": "free",
  "cached": false
}`}</code>
            </pre>
          </div>
        </section>

        {/* Paid Scan */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              x402
            </span>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              POST /api/v1/scan
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Deep scan with Claude Sonnet. Pay $0.02 USDC on Base via x402 micropayment. No API key needed — payment is in the HTTP header.
          </p>
          <div className="rounded-lg bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 p-4 mb-4 overflow-x-auto">
            <pre className="text-sm text-zinc-300">
              <code>{`# x402-enabled clients handle payment automatically.
# The endpoint returns a 402 Payment Required with payment details.
# Your x402 client pays and retries — all in one request.

curl -X POST https://vigil-protocol.vercel.app/api/v1/scan \\
  -H "Content-Type: application/json" \\
  -d '{"skillUrl": "https://github.com/user/repo/blob/main/SKILL.md"}'`}</code>
            </pre>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Returns full report with all findings, severity breakdown, and recommendation. No rate limit.
          </p>
        </section>

        {/* Score Lookup */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              FREE
            </span>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              GET /api/score
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Look up a cached trust score for a previously scanned skill. Instant, no rate limit.
          </p>
          <div className="rounded-lg bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 p-4 overflow-x-auto">
            <pre className="text-sm text-zinc-300">
              <code>{`curl "https://vigil-protocol.vercel.app/api/score?url=https://github.com/user/repo/blob/main/SKILL.md"`}</code>
            </pre>
          </div>
        </section>

        {/* MCP */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              MCP
            </span>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Claude Code Integration
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Use Vigil directly inside Claude Code via MCP. Add this to your MCP config:
          </p>
          <div className="rounded-lg bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 p-4 mb-4 overflow-x-auto">
            <pre className="text-sm text-zinc-300">
              <code>{`{
  "mcpServers": {
    "vigil": {
      "command": "node",
      "args": ["path/to/vigil-protocol/dist/mcp/server.js"]
    }
  }
}`}</code>
            </pre>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Then use <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm">vigil_scan</code> or <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm">vigil_score</code> tools in your Claude Code session.
          </p>
        </section>

        {/* On-chain */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            On-Chain (Base Mainnet)
          </h2>
          <div className="space-y-3">
            {[
              { label: "VigilToken", address: "0xb056f310664357DE82e804456eD50C2F064927F6" },
              { label: "VigilStaking", address: "0xbD2CDf58502e03175f8D36351A91fB4961248C0A" },
              { label: "VigilChallenge", address: "0x799ed3EB886B23823994965315c29AF371CC54ef" },
              { label: "BountyVault", address: "0x4FAa83a4bD2a796b65aF5071375d591C83e60b85" },
            ].map((c) => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{c.label}</span>
                <a
                  href={`https://basescan.org/address/${c.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {c.address.slice(0, 6)}...{c.address.slice(-4)}
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
