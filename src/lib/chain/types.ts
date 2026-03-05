export type ChainId = "solana" | "base";

export interface PaymentInfo {
  treasury: string;
  nativePrice: number;
  tokenPrice: number;
  tokenMint: string | null;
  network: ChainId;
  nativeCurrency: string; // "SOL" | "ETH"
}

export interface VerificationResult {
  verified: boolean;
  error?: string;
}

export interface ChainAdapter {
  chainId: ChainId;
  isValidAddress(address: string): boolean;
  verifySignature(address: string, message: string, signature: string): boolean | Promise<boolean>;
  getTokenBalance(address: string): Promise<number | null>;
  getPaymentInfo(): PaymentInfo;
  verifyNativePayment(txId: string): Promise<VerificationResult>;
  verifyTokenPayment(txId: string): Promise<VerificationResult>;
  getStake(address: string): Promise<{ amount: number; isRegistered: boolean } | null>;
  isStakingConfigured(): boolean;
}
