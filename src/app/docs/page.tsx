import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function DocsPage() {
  return (
    <div className="min-h-screen selection:bg-primary selection:text-primary-foreground">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">API DOCUMENTATION</h1>
        <p className="text-muted-foreground font-mono mb-10">
          Integrate StayVigil into your agent pipeline. Scan skills programmatically
          before installing them.
        </p>

        {/* Free Scan */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary border border-primary/40 font-mono">
              FREE
            </span>
            <h2 className="text-xl font-bold">POST /API/SCAN</h2>
          </div>
          <p className="text-muted-foreground font-mono mb-4 text-sm">
            Free scan with Llama 3.3 70B analysis. Rate limited to 10 scans/day
            per IP. Returns top 3 findings.
          </p>
          <div className="border border-primary/30 bg-black p-4 mb-4 overflow-x-auto">
            <pre className="text-sm text-primary/80 font-mono">
              <code>{`curl -X POST https://vigil-protocol.vercel.app/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"skillUrl": "https://github.com/user/repo/blob/main/SKILL.md"}'`}</code>
            </pre>
          </div>
          <h3 className="text-sm font-bold text-primary/60 mb-2 font-display uppercase tracking-wider">
            Response
          </h3>
          <div className="border border-primary/30 bg-black p-4 overflow-x-auto">
            <pre className="text-sm text-primary/80 font-mono">
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
            <span className="px-2 py-0.5 text-xs font-bold bg-accent/20 text-accent border border-accent/40 font-mono">
              PAID
            </span>
            <h2 className="text-xl font-bold">POST /API/V1/SCAN</h2>
          </div>
          <p className="text-muted-foreground font-mono mb-4 text-sm">
            Deep scan with Claude Sonnet. Pay with SOL on Solana or ETH on Base.
            No API key needed — send a transaction and include the signature.
          </p>
          <h3 className="text-sm font-bold text-primary/60 mb-2 font-display uppercase tracking-wider">
            Solana (default)
          </h3>
          <div className="border border-primary/30 bg-black p-4 mb-4 overflow-x-auto">
            <pre className="text-sm text-primary/80 font-mono">
              <code>{`# Step 1: Get payment details (returns 402 with treasury + prices)
curl -X POST https://vigil-protocol.vercel.app/api/v1/scan \\
  -H "Content-Type: application/json" \\
  -d '{"skillUrl": "https://github.com/user/repo/blob/main/SKILL.md"}'

# Step 2: Send SOL to the treasury wallet, then retry with txSignature
curl -X POST https://vigil-protocol.vercel.app/api/v1/scan \\
  -H "Content-Type: application/json" \\
  -d '{"skillUrl": "...", "txSignature": "5K7x...", "paymentType": "sol"}'`}</code>
            </pre>
          </div>
          <h3 className="text-sm font-bold text-primary/60 mb-2 font-display uppercase tracking-wider">
            Base (Ethereum L2)
          </h3>
          <div className="border border-primary/30 bg-black p-4 mb-4 overflow-x-auto">
            <pre className="text-sm text-primary/80 font-mono">
              <code>{`# Step 1: Get payment details for Base (returns 402 with ETH treasury)
curl -X POST https://vigil-protocol.vercel.app/api/v1/scan \\
  -H "Content-Type: application/json" \\
  -d '{"skillUrl": "https://github.com/user/repo/blob/main/SKILL.md", "chain": "base"}'

# Step 2: Send ETH to the treasury wallet, then retry with txSignature
curl -X POST https://vigil-protocol.vercel.app/api/v1/scan \\
  -H "Content-Type: application/json" \\
  -d '{"skillUrl": "...", "txSignature": "0xabc...", "paymentType": "sol", "chain": "base"}'`}</code>
            </pre>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            Returns full report with all findings, severity breakdown, and
            recommendation. No rate limit. Pass{" "}
            <code className="px-1.5 py-0.5 border border-primary/30 bg-black text-primary text-sm">
              chain: &quot;solana&quot; | &quot;base&quot;
            </code>{" "}
            to select network. Accepts{" "}
            <code className="px-1.5 py-0.5 border border-primary/30 bg-black text-primary text-sm">
              paymentType: &quot;sol&quot; | &quot;vigil&quot;
            </code>
          </p>
        </section>

        {/* Score Lookup */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary border border-primary/40 font-mono">
              FREE
            </span>
            <h2 className="text-xl font-bold">GET /API/SCORE</h2>
          </div>
          <p className="text-muted-foreground font-mono mb-4 text-sm">
            Look up a cached trust score for a previously scanned skill.
            Instant, no rate limit.
          </p>
          <div className="border border-primary/30 bg-black p-4 overflow-x-auto">
            <pre className="text-sm text-primary/80 font-mono">
              <code>{`curl "https://vigil-protocol.vercel.app/api/score?url=https://github.com/user/repo/blob/main/SKILL.md"`}</code>
            </pre>
          </div>
        </section>

        {/* MCP */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 text-xs font-bold bg-destructive/20 text-destructive border border-destructive/40 font-mono">
              MCP
            </span>
            <h2 className="text-xl font-bold">CLAUDE CODE INTEGRATION</h2>
          </div>
          <p className="text-muted-foreground font-mono mb-4 text-sm">
            Use StayVigil directly inside Claude Code via MCP. Supports both
            Solana and Base payments. Add this to your MCP config:
          </p>
          <div className="border border-primary/30 bg-black p-4 mb-4 overflow-x-auto">
            <pre className="text-sm text-primary/80 font-mono">
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
          <p className="text-muted-foreground font-mono text-sm">
            Then use{" "}
            <code className="px-1.5 py-0.5 border border-primary/30 bg-black text-primary text-sm">
              vigil_scan
            </code>{" "}
            or{" "}
            <code className="px-1.5 py-0.5 border border-primary/30 bg-black text-primary text-sm">
              vigil_score
            </code>{" "}
            tools in your Claude Code session.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
