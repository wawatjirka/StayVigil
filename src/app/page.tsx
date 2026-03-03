import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScanForm } from "@/components/ScanForm";
import { ShieldLogo } from "@/components/ShieldLogo";

const CHECKS = [
  { label: "Dangerous commands", desc: "rm -rf, curl|bash, eval(), sudo", icon: ">" },
  { label: "Data exfiltration", desc: "Outbound HTTP, webhooks, tunnels", icon: "^" },
  { label: "Prompt injection", desc: "Override instructions, identity hijack", icon: "!" },
  { label: "Permission overreach", desc: "Excessive tool access (Bash, Write)", icon: "#" },
  { label: "Dependency risk", desc: "npm install, piped downloads, git clone", icon: "@" },
  { label: "Code obfuscation", desc: "Base64, hex encoding, fromCharCode", icon: "~" },
  { label: "Sensitive file access", desc: ".env, credentials, private keys", icon: "*" },
  { label: "AI deep review", desc: "Hidden logic, social engineering, backdoors", icon: "?" },
];

const STATS = [
  { value: "12", label: "Static checks" },
  { value: "8", label: "LLM audit categories" },
  { value: "$0.02", label: "Per scan (x402)" },
  { value: "Base", label: "Network" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative grid-bg overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl" />
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
            {/* Shield with glow */}
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/30 to-violet-500/30 rounded-full blur-2xl" />
              <ShieldLogo size={80} className="relative mx-auto" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-500 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Scanning on Base
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-zinc-900 dark:text-zinc-100">Trust, but </span>
              <span className="gradient-text">verify.</span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto mb-3">
              Scan AI agent skills for vulnerabilities&nbsp;&middot;&nbsp;prompt injection&nbsp;&middot;&nbsp;data exfiltration&nbsp;&middot;&nbsp;malicious patterns
            </p>
            <p className="text-sm text-zinc-400 mb-12">
              10 free scans per day&nbsp;&middot;&nbsp;Full reports via x402 micropayment
            </p>

            <ScanForm />
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold font-mono gradient-text">
                    {stat.value}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2 text-center uppercase tracking-wide">
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-14 text-center">
            Three steps to verified trust
          </h2>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Gradient connecting line (desktop) */}
            <div className="hidden md:block absolute top-7 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-blue-500/20 via-violet-500/40 to-blue-500/20" />

            {[
              {
                step: "1",
                title: "Paste a skill URL",
                desc: "GitHub repo, raw URL, or SkillsMP link. We fetch and parse the SKILL.md and any bundled scripts.",
              },
              {
                step: "2",
                title: "Static + AI analysis",
                desc: "7 rule-based security checks plus deep LLM review for hidden instructions, obfuscation, and social engineering.",
              },
              {
                step: "3",
                title: "Get a trust score",
                desc: "Score 0-100 with detailed findings. Green = safe, yellow = caution, red = danger.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 text-lg">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What we check */}
        <section className="bg-zinc-50/50 dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-12 text-center">
              What we scan for
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CHECKS.map((item) => (
                <div
                  key={item.label}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-blue-300 dark:hover:border-blue-800 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 font-mono text-sm text-zinc-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                    {item.icon}
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                    {item.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <ShieldLogo size={48} className="mx-auto mb-6 opacity-30" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            For AI agents: pay-per-scan via x402
          </h2>
          <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
            Integrate Vigil into your agent pipeline. Pay $0.02 USDC per scan via HTTP-native micropayments on Base. No API keys needed.
          </p>
          <div className="inline-flex gap-3">
            <a
              href="/auditor"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              Become an Auditor
            </a>
            <a
              href="/docs"
              className="px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 font-medium text-sm transition-colors"
            >
              API Docs
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
