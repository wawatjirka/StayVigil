import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import nacl from "tweetnacl";
import { default as bs58 } from "bs58";
import {
  getSolanaConnection,
  getTokenMint,
  getTreasuryWallet,
  getScanPriceSol,
  getScanPriceVigil,
} from "./solana";

/**
 * Validate a base58-encoded Solana address.
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const key = new PublicKey(address);
    return PublicKey.isOnCurve(key.toBytes());
  } catch {
    return false;
  }
}

/**
 * Verify an Ed25519 signature produced by a Solana wallet.
 */
export function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signature: string
): boolean {
  try {
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}

/**
 * Get the $VIGIL SPL token balance for a wallet.
 * Returns null if VIGIL_TOKEN_MINT is not set (demo/pre-launch mode).
 */
export async function getVigilTokenBalance(
  walletAddress: string
): Promise<number | null> {
  const mint = getTokenMint();
  if (!mint) return null;

  try {
    const connection = getSolanaConnection();
    const owner = new PublicKey(walletAddress);
    const ata = await getAssociatedTokenAddress(mint, owner);
    const account = await getAccount(connection, ata);
    // SPL tokens typically use 6 or 9 decimals — normalize to whole tokens
    // pump.fun tokens use 6 decimals
    return Number(account.amount) / 1e6;
  } catch {
    // Account doesn't exist = 0 balance
    return 0;
  }
}

/**
 * Verify a SOL transfer to the treasury wallet.
 * Checks that the transaction transferred at least SCAN_PRICE_SOL to the treasury.
 */
export async function verifySolPayment(
  txSignature: string
): Promise<{ verified: boolean; error?: string }> {
  const treasury = getTreasuryWallet();
  if (!treasury) return { verified: false, error: "Treasury wallet not configured" };

  try {
    const connection = getSolanaConnection();
    const tx = await connection.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) {
      return { verified: false, error: "Transaction not found or not confirmed" };
    }

    if (tx.meta.err) {
      return { verified: false, error: "Transaction failed on-chain" };
    }

    // Check SOL balance changes — find treasury in account keys
    const accountKeys = tx.transaction.message.getAccountKeys();
    const treasuryIndex = accountKeys
      .keySegments()
      .flat()
      .findIndex((key) => key.equals(treasury));

    if (treasuryIndex === -1) {
      return { verified: false, error: "Treasury not found in transaction" };
    }

    const preBalance = tx.meta.preBalances[treasuryIndex];
    const postBalance = tx.meta.postBalances[treasuryIndex];
    const received = (postBalance - preBalance) / LAMPORTS_PER_SOL;
    const required = getScanPriceSol();

    if (received < required) {
      return {
        verified: false,
        error: `Insufficient payment: received ${received} SOL, required ${required} SOL`,
      };
    }

    return { verified: true };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Verify a $VIGIL SPL token transfer to the treasury wallet.
 */
export async function verifyVigilPayment(
  txSignature: string
): Promise<{ verified: boolean; error?: string }> {
  const treasury = getTreasuryWallet();
  const mint = getTokenMint();
  if (!treasury) return { verified: false, error: "Treasury wallet not configured" };
  if (!mint) return { verified: false, error: "VIGIL token mint not configured" };

  try {
    const connection = getSolanaConnection();
    const tx = await connection.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) {
      return { verified: false, error: "Transaction not found or not confirmed" };
    }

    if (tx.meta.err) {
      return { verified: false, error: "Transaction failed on-chain" };
    }

    // Check token balance changes in postTokenBalances
    const treasuryAddr = treasury.toBase58();
    const mintAddr = mint.toBase58();
    const required = getScanPriceVigil();

    const preTokenBalances = tx.meta.preTokenBalances || [];
    const postTokenBalances = tx.meta.postTokenBalances || [];

    // Find treasury's token balance for the VIGIL mint
    const postEntry = postTokenBalances.find(
      (b) => b.owner === treasuryAddr && b.mint === mintAddr
    );
    const preEntry = preTokenBalances.find(
      (b) => b.owner === treasuryAddr && b.mint === mintAddr
    );

    const postAmount = postEntry?.uiTokenAmount?.uiAmount ?? 0;
    const preAmount = preEntry?.uiTokenAmount?.uiAmount ?? 0;
    const received = postAmount - preAmount;

    if (received < required) {
      return {
        verified: false,
        error: `Insufficient payment: received ${received} $VIGIL, required ${required} $VIGIL`,
      };
    }

    return { verified: true };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}
