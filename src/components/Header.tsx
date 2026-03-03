"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldLogo } from "./ShieldLogo";

const NAV_ITEMS = [
  { href: "/", label: "Scan" },
  { href: "/auditor", label: "Auditors" },
  { href: "/docs", label: "API" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg">
      <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <ShieldLogo
            size={28}
            className="drop-shadow-sm group-hover:drop-shadow-md transition-all duration-200"
          />
          <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
            Vigil
          </span>
          <span className="font-light text-lg text-zinc-400">
            Protocol
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
