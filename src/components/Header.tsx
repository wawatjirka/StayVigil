"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, Cpu } from "lucide-react";
import { ChainSelector } from "./ChainSelector";

const NAV_ITEMS = [
  { href: "/", label: "Scan" },
  { href: "/auditor", label: "Auditors" },
  { href: "/docs", label: "API" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-primary/30 p-4 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur z-[60]">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <Eye className="w-8 h-8 text-primary animate-pulse" />
          <span className="font-display font-bold text-xl tracking-widest text-primary glitch-text">
            STAYVIGIL
          </span>
        </Link>
      </div>
      <div className="flex gap-4 items-center font-mono text-sm">
        <div className="hidden md:flex gap-4 mr-4 border-r border-primary/30 pr-4">
          <ChainSelector />
          <span className="text-muted-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4" /> STATUS: ONLINE
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-xs uppercase font-bold tracking-wider transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-primary/60 hover:bg-primary/10 hover:text-primary"
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
