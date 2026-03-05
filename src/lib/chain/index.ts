import type { ChainId, ChainAdapter } from "./types";
import { SolanaAdapter } from "./solana-adapter";

export type { ChainId, ChainAdapter, PaymentInfo, VerificationResult } from "./types";

export const BASE_ENABLED = process.env.NEXT_PUBLIC_BASE_ENABLED === "true";

const solanaAdapter = new SolanaAdapter();

// Lazy-load BaseAdapter only when needed (avoid importing viem when Base is off)
let baseAdapter: ChainAdapter | null = null;

export function isValidChainId(chain: string): chain is ChainId {
  if (chain === "solana") return true;
  if (chain === "base") return BASE_ENABLED;
  return false;
}

export function getChainAdapter(chain: ChainId = "solana"): ChainAdapter {
  if (chain === "base") {
    if (!BASE_ENABLED) {
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
