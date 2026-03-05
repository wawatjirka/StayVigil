import { SolanaSDK, IPFSClient, buildRegistrationFileJson, ServiceType } from "8004-solana";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

// Vigil's agent metadata for 8004-solana registration
export const VIGIL_AGENT_METADATA = {
  name: "StayVigil",
  description: "Decentralized skill verification network for AI agent skills. Scans agent skills for security vulnerabilities before installation.",
  image: "", // Set after IPFS upload
  services: [
    { type: ServiceType.MCP, value: "https://vigil-protocol.vercel.app/mcp" },
    { type: ServiceType.A2A, value: "https://vigil-protocol.vercel.app/api/v1" },
  ],
};

let _sdkInstance: SolanaSDK | null = null;

/**
 * Get or create a cached SolanaSDK instance for 8004-solana operations.
 */
export function getSolana8004SDK(): SolanaSDK {
  if (_sdkInstance) return _sdkInstance;

  const keypairSecret = process.env.VIGIL_AGENT_KEYPAIR;
  if (!keypairSecret) {
    throw new Error("VIGIL_AGENT_KEYPAIR not configured");
  }

  const signer = Keypair.fromSecretKey(bs58.decode(keypairSecret));

  const ipfsClient = new IPFSClient({
    pinataEnabled: !!process.env.PINATA_JWT,
    pinataJwt: process.env.PINATA_JWT || "",
  });

  _sdkInstance = new SolanaSDK({
    cluster: (process.env.SOLANA_8004_CLUSTER as "devnet" | "mainnet-beta") || "mainnet-beta",
    signer,
    ipfsClient,
  });

  return _sdkInstance;
}

/**
 * Upload metadata to IPFS via Pinata, returning an ipfs:// URI.
 */
async function uploadMetadataToIPFS(metadata: Record<string, unknown>): Promise<string> {
  const ipfsClient = new IPFSClient({
    pinataEnabled: !!process.env.PINATA_JWT,
    pinataJwt: process.env.PINATA_JWT || "",
  });
  return await ipfsClient.addJson(metadata);
}

/**
 * Register Vigil as an agent on the 8004 Solana registry.
 * Uploads metadata to IPFS, then mints a Metaplex Core NFT.
 */
export async function registerVigilAgent() {
  const sdk = getSolana8004SDK();

  const registrationJson = buildRegistrationFileJson({
    name: VIGIL_AGENT_METADATA.name,
    description: VIGIL_AGENT_METADATA.description,
    image: VIGIL_AGENT_METADATA.image,
    services: VIGIL_AGENT_METADATA.services,
  });

  // Upload to IPFS separately (ipfsClient is private on SolanaSDK)
  const metadataUri = await uploadMetadataToIPFS(registrationJson);

  // Register on-chain — returns asset pubkey
  const result = await sdk.registerAgent(metadataUri, { atomEnabled: true });
  return result;
}

/**
 * Get Vigil's agent identity by asset pubkey or numeric agent ID.
 */
export async function getVigilIdentity(agentId: string | number) {
  const sdk = getSolana8004SDK();
  try {
    if (typeof agentId === "string" && agentId.length > 10) {
      // Treat as base58 asset pubkey
      return await sdk.loadAgent(new PublicKey(agentId));
    }
    // Treat as numeric sequence ID
    return await sdk.getAgentByAgentId(Number(agentId));
  } catch {
    return null;
  }
}

/**
 * Update Vigil's agent metadata URI.
 */
export async function updateVigilMetadata(assetPubkey: string, metadataUri: string) {
  const sdk = getSolana8004SDK();
  return await sdk.setAgentUri(new PublicKey(assetPubkey), metadataUri);
}

/**
 * Get Vigil's Solana pubkey (base58).
 */
export function getVigilAddress(): string {
  const keypairSecret = process.env.VIGIL_AGENT_KEYPAIR;
  if (!keypairSecret) {
    throw new Error("VIGIL_AGENT_KEYPAIR not configured");
  }
  const signer = Keypair.fromSecretKey(bs58.decode(keypairSecret));
  return signer.publicKey.toBase58();
}

/**
 * Get the agent NFT asset pubkey from env.
 */
export function getVigilAssetPubkey(): string | null {
  return process.env.VIGIL_AGENT_ASSET_PUBKEY || null;
}
