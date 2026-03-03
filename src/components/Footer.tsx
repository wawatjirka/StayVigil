import Link from "next/link";
import { ShieldLogo } from "./ShieldLogo";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10 mt-auto">
      <div className="max-w-5xl mx-auto px-6 space-y-6">
        {/* Brand row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldLogo size={20} />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Vigil Protocol
            </span>
          </div>
          <p className="text-sm text-zinc-400 text-center sm:text-right">
            Decentralized skill verification on Base. Powered by Claude AI.
          </p>
        </div>

        {/* Separator */}
        <div className="border-t border-zinc-100 dark:border-zinc-800/60" />

        {/* Links row */}
        <div className="flex items-center justify-center gap-6 text-sm text-zinc-400">
          <Link
            href="/docs"
            className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            API Docs
          </Link>
          <Link
            href="/auditor"
            className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Auditors
          </Link>
        </div>
      </div>
    </footer>
  );
}
