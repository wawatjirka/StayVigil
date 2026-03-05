import type { ChainId, ChainAdapter } from "./types";
import { SolanaAdapter } from "./solana-adapter";

export type { ChainId, ChainAdapter, PaymentInfo, VerificationResult } from "./types";

// Server-side runtime check — uses non-prefixed var to avoid Next.js build-time inlining
export function isBaseEnabled(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = process.env as any;
  const val = env["BASE_ENABLED"] || env["NEXT_PUBLIC_BASE_ENABLED"];
  console.log("[chain] isBaseEnabled check:", { BASE_ENABLED: env["BASE_ENABLED"], NEXT_PUBLIC: env["NEXT_PUBLIC_BASE_ENABLED"], result: val === "true" });
  return val === "true";
}

// Keep const export for client-side context (inlined at build time is fine for UI)
export const BASE_ENABLED = process.env.NEXT_PUBLIC_BASE_ENABLED === "true";

const solanaAdapter = new SolanaAdapter();

// Lazy-load BaseAdapter only when needed (avoid importing viem when Base is off)
let baseAdapter: ChainAdapter | null = null;

export function isValidChainId(chain: string): chain is ChainId {
  if (chain === "solana") return true;
  if (chain === "base") return isBaseEnabled();
  return false;
}

export function getChainAdapter(chain: ChainId = "solana"): ChainAdapter {
  if (chain === "base") {
    if (!isBaseEnabled()) {
      throw new Error("Base chain is not enabled");
    }
    if (!baseAdapter) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BaseAdapter } = require("./base-adapter");
      baseAdapter = new BaseAdapter();
    }
    return baseAdapter!;
  }
  return solanaAdapter;
}
