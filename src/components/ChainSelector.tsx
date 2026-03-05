"use client";

import { Activity } from "lucide-react";
import { useChain } from "@/lib/chain/context";

export function ChainSelector() {
  const { chain, setChain, baseEnabled } = useChain();

  if (!baseEnabled) {
    return (
      <span className="text-muted-foreground flex items-center gap-2">
        <Activity className="w-4 h-4" /> NET: SOLANA
      </span>
    );
  }

  return (
    <button
      onClick={() => setChain(chain === "solana" ? "base" : "solana")}
      className="text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
    >
      <Activity className="w-4 h-4" />
      NET: {chain === "solana" ? "SOLANA" : "BASE"}
    </button>
  );
}
