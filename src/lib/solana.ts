import { Connection, PublicKey } from "@solana/web3.js";

let _connection: Connection | null = null;

/**
 * Cached Solana RPC connection singleton.
 */
export function getSolanaConnection(): Connection {
  if (_connection) return _connection;
  const rpcUrl =
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";
  _connection = new Connection(rpcUrl, "confirmed");
  return _connection;
}

/**
 * Returns the SPL token mint address, or null if not yet set (demo mode).
 */
export function getTokenMint(): PublicKey | null {
  const mint = process.env.VIGIL_TOKEN_MINT;
  if (!mint) return null;
  try {
    return new PublicKey(mint);
  } catch {
    return null;
  }
}

/**
 * Treasury wallet that receives scan payments.
 */
export function getTreasuryWallet(): PublicKey | null {
  const addr = process.env.SCAN_TREASURY_WALLET;
  if (!addr) return null;
  try {
    return new PublicKey(addr);
  } catch {
    return null;
  }
}

/**
 * Price for a paid scan in SOL.
 */
export function getScanPriceSol(): number {
  return parseFloat(process.env.SCAN_PRICE_SOL || "0.0001");
}

/**
 * Price for a paid scan in SPL tokens.
 */
export function getScanPriceVigil(): number {
  return parseFloat(process.env.SCAN_PRICE_VIGIL || "100");
}
