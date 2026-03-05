import {
  createPublicClient,
  http,
  isAddress,
  verifyMessage,
  parseAbiItem,
  type PublicClient,
} from "viem";
import { base } from "viem/chains";
import type { ChainAdapter, PaymentInfo, VerificationResult } from "./types";

const ERC20_BALANCE_OF = parseAbiItem(
  "function balanceOf(address account) view returns (uint256)"
);

const STAKING_STAKES = parseAbiItem(
  "function stakes(address) view returns (uint256 amount, bool isRegistered)"
);

function getBaseRpcUrl(): string {
  return (
    process.env.BASE_RPC_URL ||
    process.env.NEXT_PUBLIC_BASE_RPC_URL ||
    "https://mainnet.base.org"
  );
}

let _client: PublicClient | null = null;

function getClient(): PublicClient {
  if (_client) return _client;
  _client = createPublicClient({
    chain: base,
    transport: http(getBaseRpcUrl()),
  }) as PublicClient;
  return _client;
}

function getTreasury(): string | null {
  return process.env.BASE_TREASURY_WALLET || null;
}

function getTokenAddress(): string | null {
  return process.env.BASE_VIGIL_TOKEN_ADDRESS || null;
}

function getScanPriceEth(): number {
  return parseFloat(process.env.BASE_SCAN_PRICE_ETH || "0.0001");
}

function getScanPriceToken(): number {
  return parseFloat(process.env.BASE_SCAN_PRICE_TOKEN || "100");
}

function getStakingContract(): string | null {
  return process.env.BASE_STAKING_CONTRACT || null;
}

export class BaseAdapter implements ChainAdapter {
  chainId = "base" as const;

  isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  async verifySignature(
    address: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      return await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch {
      return false;
    }
  }

  async getTokenBalance(address: string): Promise<number | null> {
    const tokenAddress = getTokenAddress();
    if (!tokenAddress) return null;

    try {
      const client = getClient();
      const balance = await client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [ERC20_BALANCE_OF],
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });
      // ERC20 tokens typically use 18 decimals
      return Number(balance) / 1e18;
    } catch {
      return 0;
    }
  }

  getPaymentInfo(): PaymentInfo {
    return {
      treasury: getTreasury() ?? "",
      nativePrice: getScanPriceEth(),
      tokenPrice: getScanPriceToken(),
      tokenMint: getTokenAddress(),
      network: "base",
      nativeCurrency: "ETH",
    };
  }

  async verifyNativePayment(txId: string): Promise<VerificationResult> {
    const treasury = getTreasury();
    if (!treasury) return { verified: false, error: "Base treasury wallet not configured" };

    try {
      const client = getClient();
      const tx = await client.getTransaction({
        hash: txId as `0x${string}`,
      });

      if (!tx) {
        return { verified: false, error: "Transaction not found" };
      }

      const receipt = await client.getTransactionReceipt({
        hash: txId as `0x${string}`,
      });

      if (receipt.status === "reverted") {
        return { verified: false, error: "Transaction reverted" };
      }

      // Check recipient and value
      if (tx.to?.toLowerCase() !== treasury.toLowerCase()) {
        return { verified: false, error: "Transaction not sent to treasury" };
      }

      const receivedEth = Number(tx.value) / 1e18;
      const required = getScanPriceEth();

      if (receivedEth < required) {
        return {
          verified: false,
          error: `Insufficient payment: received ${receivedEth} ETH, required ${required} ETH`,
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

  async verifyTokenPayment(txId: string): Promise<VerificationResult> {
    const treasury = getTreasury();
    const tokenAddress = getTokenAddress();
    if (!treasury) return { verified: false, error: "Base treasury wallet not configured" };
    if (!tokenAddress) return { verified: false, error: "Base token address not configured" };

    try {
      const client = getClient();
      const receipt = await client.getTransactionReceipt({
        hash: txId as `0x${string}`,
      });

      if (receipt.status === "reverted") {
        return { verified: false, error: "Transaction reverted" };
      }

      // Parse ERC20 Transfer events from logs
      const transferTopic =
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // Transfer(address,address,uint256)

      const transferLog = receipt.logs.find(
        (log) =>
          log.address.toLowerCase() === tokenAddress.toLowerCase() &&
          log.topics[0] === transferTopic &&
          log.topics[2] &&
          `0x${log.topics[2].slice(26)}`.toLowerCase() === treasury.toLowerCase()
      );

      if (!transferLog) {
        return { verified: false, error: "No token transfer to treasury found in transaction" };
      }

      const amount = Number(BigInt(transferLog.data)) / 1e18;
      const required = getScanPriceToken();

      if (amount < required) {
        return {
          verified: false,
          error: `Insufficient token payment: received ${amount}, required ${required}`,
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

  async getStake(
    address: string
  ): Promise<{ amount: number; isRegistered: boolean } | null> {
    const stakingContract = getStakingContract();
    if (!stakingContract) return null;

    try {
      const client = getClient();
      const result = await client.readContract({
        address: stakingContract as `0x${string}`,
        abi: [STAKING_STAKES],
        functionName: "stakes",
        args: [address as `0x${string}`],
      });

      const [amount, isRegistered] = result as [bigint, boolean];
      return {
        amount: Number(amount) / 1e18,
        isRegistered,
      };
    } catch {
      return null;
    }
  }

  isStakingConfigured(): boolean {
    return !!getStakingContract();
  }
}
