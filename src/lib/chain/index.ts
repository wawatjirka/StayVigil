import type { ChainId, ChainAdapter } from "./types";
import { SolanaAdapter } from "./solana-adapter";

export type { ChainId, ChainAdapter, PaymentInfo, VerificationResult } from "./types";

// Use a function so NEXT_PUBLIC_ var is read at runtime, not inlined at build time
export function isBaseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BASE_ENABLED === "true" || process.env.BASE_ENABLED === "true";
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
