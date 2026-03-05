import type { ChainAdapter, PaymentInfo, VerificationResult } from "./types";
import {
  isValidSolanaAddress,
  verifyWalletSignature,
  getVigilTokenBalance,
  verifySolPayment,
  verifyVigilPayment,
} from "../solana-verify";
import {
  getTreasuryWallet,
  getTokenMint,
  getScanPriceSol,
  getScanPriceVigil,
} from "../solana";
import { getOnChainStake, isStakingConfigured } from "../solana-programs";

export class SolanaAdapter implements ChainAdapter {
  chainId = "solana" as const;

  isValidAddress(address: string): boolean {
    return isValidSolanaAddress(address);
  }

  verifySignature(address: string, message: string, signature: string): boolean {
    return verifyWalletSignature(address, message, signature);
  }

  async getTokenBalance(address: string): Promise<number | null> {
    return getVigilTokenBalance(address);
  }

  getPaymentInfo(): PaymentInfo {
    const treasury = getTreasuryWallet();
    const mint = getTokenMint();
    return {
      treasury: treasury?.toBase58() ?? "",
      nativePrice: getScanPriceSol(),
      tokenPrice: getScanPriceVigil(),
      tokenMint: mint?.toBase58() ?? null,
      network: "solana",
      nativeCurrency: "SOL",
    };
  }

  async verifyNativePayment(txId: string): Promise<VerificationResult> {
    return verifySolPayment(txId);
  }

  async verifyTokenPayment(txId: string): Promise<VerificationResult> {
    return verifyVigilPayment(txId);
  }

  async getStake(address: string): Promise<{ amount: number; isRegistered: boolean } | null> {
    const stake = await getOnChainStake(address);
    if (!stake) return null;
    return {
      amount: stake.amount / 1e6,
      isRegistered: stake.isRegistered,
    };
  }

  isStakingConfigured(): boolean {
    return isStakingConfigured();
  }
}
