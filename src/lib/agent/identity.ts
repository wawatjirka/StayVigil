import { ERC8004Client, ViemAdapter } from "erc-8004-js";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// Vigil's on-chain agent identity configuration
export const VIGIL_AGENT_METADATA = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "Vigil Protocol",
  description: "Decentralized skill verification network for AI agent skills. Scans agent skills for security vulnerabilities before installation.",
  services: [
    { name: "MCP", endpoint: "https://vigil-protocol.vercel.app/mcp" },
    { name: "web", endpoint: "https://vigil-protocol.vercel.app/api/v1" },
    { name: "scan", endpoint: "https://vigil-protocol.vercel.app/api/scan" },
  ],
  x402Support: true,
  active: true,
  supportedTrust: ["reputation"],
};

// ERC-8004 contract addresses on Base Mainnet
const ERC8004_ADDRESSES = {
  identityRegistry: process.env.ERC8004_IDENTITY_REGISTRY || "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  reputationRegistry: process.env.ERC8004_REPUTATION_REGISTRY || "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  validationRegistry: "0x0000000000000000000000000000000000000000",
  chainId: 8453,
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
    chain: base,
    transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new ViemAdapter(publicClient as any, walletClient as any, account as any);

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
