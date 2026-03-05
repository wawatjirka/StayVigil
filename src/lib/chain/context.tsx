"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ChainId } from "./types";

export const BASE_ENABLED = process.env.NEXT_PUBLIC_BASE_ENABLED === "true";

interface ChainContextValue {
  chain: ChainId;
  setChain: (chain: ChainId) => void;
  baseEnabled: boolean;
}

const ChainContext = createContext<ChainContextValue>({
  chain: "solana",
  setChain: () => {},
  baseEnabled: false,
});

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chain, setChain] = useState<ChainId>("solana");

  return (
    <ChainContext.Provider value={{ chain, setChain, baseEnabled: BASE_ENABLED }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain() {
  return useContext(ChainContext);
}
