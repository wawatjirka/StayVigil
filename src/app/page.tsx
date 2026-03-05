import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScanForm } from "@/components/ScanForm";

export default function Home() {
  return (
    <div className="min-h-screen pb-20 selection:bg-primary selection:text-primary-foreground">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-32">
          <div className="space-y-6 z-10 relative">
            <div className="inline-block border border-accent text-accent px-3 py-1 font-mono text-sm bg-accent/10 mb-4 animate-pulse">
              [ SYSTEM ALERT ] MULTIPLE THREATS DETECTED
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-none mb-6">
              TRUST <br />
              <span className="text-destructive/90 glitch-text">
                BUT VERIFY.
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-mono text-muted-foreground max-w-lg leading-relaxed">
              Scan AI agent skills for vulnerabilities, prompt injection, data
              exfiltration, and malicious patterns before they nuke your wallet.
            </p>

            <div className="mt-8">
              <ScanForm />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-primary/20 font-mono text-sm">
              <div className="flex flex-col">
                <span className="text-3xl text-primary font-bold">12</span>
                <span className="text-muted-foreground">Static Checks</span>
              </div>
              <div className="flex flex-col border-l border-primary/20 pl-4">
                <span className="text-3xl text-primary font-bold">8</span>
                <span className="text-muted-foreground">LLM Audits</span>
              </div>
              <div className="flex flex-col border-l border-primary/20 pl-4">
                <span className="text-3xl text-accent font-bold">0.0001</span>
                <span className="text-muted-foreground">Per Scan (SOL)</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            {/* Background elements for mascot */}
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl mix-blend-screen animate-pulse" />
            <div className="absolute w-full h-full border border-primary/20 rounded-full animate-[spin_10s_linear_infinite] border-dashed" />
            <div className="absolute w-3/4 h-3/4 border border-accent/20 rounded-full animate-[spin_15s_linear_infinite_reverse] border-dotted" />

            <Image
              src="/landing-vigil.svg"
              alt="StayVigil"
              width={500}
              height={500}
              className="relative z-10 w-full max-w-[500px] object-contain drop-shadow-[0_0_30px_rgba(218,119,86,0.2)] hover:scale-105 transition-transform duration-500"
              priority
            />

            {/* Floating warning tags */}
            <div className="absolute top-10 right-10 bg-black/80 border border-destructive text-destructive font-mono text-xs px-2 py-1 rotate-12 backdrop-blur z-20">
              ! THREAT DETECTED
            </div>
            <div className="absolute bottom-20 left-10 bg-black/80 border border-primary text-primary font-mono text-xs px-2 py-1 -rotate-6 backdrop-blur z-20">
              SCANNING...
            </div>
          </div>
        </div>

        {/* Execution Pipeline */}
        <div className="mb-32">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 flex items-center gap-4">
            EXECUTION PIPELINE
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="brutal-border bg-black/50 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-primary/20 font-display text-6xl font-black group-hover:text-primary/40 transition-colors">
                01
              </div>
              <h3 className="text-xl font-bold mb-2">TARGET ACQUIRED</h3>
              <p className="font-mono text-muted-foreground text-sm">
                Paste GitHub repo, raw URL, or SkillsMP link. We extract
                SKILL.md and all bundled scripts.
              </p>
            </div>

            <div className="brutal-border bg-black/50 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-primary/20 font-display text-6xl font-black group-hover:text-primary/40 transition-colors">
                02
              </div>
              <h3 className="text-xl font-bold mb-2 text-accent">DEEP SCAN</h3>
              <p className="font-mono text-muted-foreground text-sm">
                7 rule-based security checks + LLM review for hidden
                instructions, obfuscation, and social engineering.
              </p>
            </div>

            <div className="brutal-border bg-black/50 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-primary/20 font-display text-6xl font-black group-hover:text-primary/40 transition-colors">
                03
              </div>
              <h3 className="text-xl font-bold mb-2 text-destructive">
                TRUST VERDICT
              </h3>
              <p className="font-mono text-muted-foreground text-sm">
                Score 0-100. Cryptographic proof of scan. Green = safe, Yellow =
                degens only, Red = insta-rekt.
              </p>
            </div>
          </div>
        </div>

        {/* Threat Matrix */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 flex items-center gap-4">
            THREAT MATRIX
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {[
              { title: "DANGEROUS CMDS", desc: "rm -rf, curl|bash, eval()", color: "text-destructive", border: "border-destructive/50" },
              { title: "DATA EXFIL", desc: "Outbound HTTP, webhooks", color: "text-accent", border: "border-accent/50" },
              { title: "PROMPT INJECT", desc: "Identity hijack, overrides", color: "text-destructive", border: "border-destructive/50" },
              { title: "PERMISSION CREEP", desc: "Excessive bash/write access", color: "text-primary", border: "border-primary/50" },
              { title: "DEPENDENCY RISK", desc: "npm install, git clone", color: "text-accent", border: "border-accent/50" },
              { title: "OBFUSCATION", desc: "Base64, hex, fromCharCode", color: "text-primary", border: "border-primary/50" },
              { title: "FILE SNOOPING", desc: ".env, private keys access", color: "text-destructive", border: "border-destructive/50" },
              { title: "AI DEEP REVIEW", desc: "Hidden logic, backdoors", color: "text-primary", border: "border-primary/50" },
            ].map((threat) => (
              <div
                key={threat.title}
                className={`border ${threat.border} bg-black/40 p-4 hover:bg-white/5 transition-colors cursor-crosshair`}
              >
                <h4 className={`font-bold text-sm mb-1 ${threat.color}`}>
                  {threat.title}
                </h4>
                <p className="text-xs text-muted-foreground">{threat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="border border-primary bg-primary/5 p-8 md:p-12 text-center relative overflow-hidden mb-20 brutal-border">
          <h2 className="text-3xl md:text-4xl font-black mb-4 relative z-10">
            FOR AI AGENTS: PAY-PER-SCAN
          </h2>
          <p className="font-mono text-muted-foreground mb-8 max-w-2xl mx-auto relative z-10">
            Integrate StayVigil into your agent pipeline. Pay per scan with SOL
            or ETH. No API keys needed. Just raw survival.
          </p>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auditor"
              className="brutal-border bg-black text-primary border-primary border-2 font-display font-bold text-xl px-8 py-4 uppercase hover:bg-primary hover:text-black transition-colors inline-block"
            >
              [ BECOME AN AUDITOR ]
            </a>
            <a
              href="/docs"
              className="border-2 border-primary/50 text-primary/80 font-display font-bold text-xl px-8 py-4 uppercase hover:border-primary hover:text-primary transition-colors inline-block"
            >
              [ API DOCS ]
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
