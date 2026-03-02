import { ERC8004Client, ViemAdapter } from "erc-8004-js";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Vigil's on-chain agent identity configuration
export const VIGIL_AGENT_METADATA = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "Vigil Protocol",
  description: "Decentralized skill verification network for AI agent skills",
  services: [
    { name: "MCP", endpoint: "https://vigil.protocol/mcp" },
    { name: "web", endpoint: "https://vigil.protocol/api/v1" },
  ],
  x402Support: true,
  active: true,
  supportedTrust: ["reputation"],
};

// ERC-8004 contract addresses on Base Sepolia — set via env
const ERC8004_ADDRESSES = {
  identityRegistry: process.env.ERC8004_IDENTITY_REGISTRY || "0x0000000000000000000000000000000000000000",
  reputationRegistry: process.env.ERC8004_REPUTATION_REGISTRY || "0x0000000000000000000000000000000000000000",
  validationRegistry: process.env.ERC8004_VALIDATION_REGISTRY || "0x0000000000000000000000000000000000000000",
  chainId: 84532,
};

function getVigilWallet() {
  const privateKey = process.env.VIGIL_AGENT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("VIGIL_AGENT_PRIVATE_KEY not configured");
  }
  return privateKeyToAccount(privateKey as `0x${string}`);
}

export function getERC8004Client(): ERC8004Client {
  const account = getVigilWallet();

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new ViemAdapter(publicClient as any, walletClient as any);

  return new ERC8004Client({
    adapter,
    addresses: ERC8004_ADDRESSES,
  });
}

/**
 * Register Vigil as an agent on the ERC-8004 Identity Registry.
 * Returns the agentId from the transaction receipt.
 */
export async function registerVigilAgent() {
  const client = getERC8004Client();
  const tx = await client.identity.registerWithMetadata(
    JSON.stringify(VIGIL_AGENT_METADATA)
  );
  return tx;
}

/**
 * Get Vigil's agent token URI by agentId.
 */
export async function getVigilIdentity(agentId: number) {
  const client = getERC8004Client();
  try {
    const uri = await client.identity.getTokenURI(BigInt(agentId));
    return { agentId, uri };
  } catch {
    return null;
  }
}

/**
 * Update Vigil's agent metadata URI.
 */
export async function updateVigilMetadata(agentId: number, metadataUri: string) {
  const client = getERC8004Client();
  const tx = await client.identity.setAgentURI(BigInt(agentId), metadataUri);
  return tx;
}

/**
 * Get Vigil's on-chain agent address.
 */
export function getVigilAddress() {
  return getVigilWallet().address;
}
