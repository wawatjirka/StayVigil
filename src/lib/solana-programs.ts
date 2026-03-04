/* eslint-disable @typescript-eslint/no-explicit-any */
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "./solana";

import vigilStakingIdlBase from "./idl/vigil_staking.json";
import vigilChallengeIdlBase from "./idl/vigil_challenge.json";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import bountyVaultIdlBase from "./idl/bounty_vault.json";

// Program IDs from env or defaults (localnet placeholders)
const STAKING_PROGRAM_ID = new PublicKey(
  process.env.VIGIL_STAKING_PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);
const CHALLENGE_PROGRAM_ID = new PublicKey(
  process.env.VIGIL_CHALLENGE_PROGRAM_ID || "HmbTLCmaGtYhSJaoxkmkN8CZqC9i5WhznDGQpsJHnUre"
);
const BOUNTY_VAULT_PROGRAM_ID = new PublicKey(
  process.env.BOUNTY_VAULT_PROGRAM_ID || "9RK1q3G3oJX5eFPRGLMgV6JdWbczjWkY4aRq6LcaF5dm"
);

// Inject `address` into IDLs so Anchor can resolve program IDs
const vigilStakingIdl = { ...vigilStakingIdlBase, address: STAKING_PROGRAM_ID.toBase58() };
const vigilChallengeIdl = { ...vigilChallengeIdlBase, address: CHALLENGE_PROGRAM_ID.toBase58() };
const bountyVaultIdl = { ...bountyVaultIdlBase, address: BOUNTY_VAULT_PROGRAM_ID.toBase58() };

// Tier thresholds in base units (6 decimals)
const TIER_THRESHOLDS = {
  bronze: 1_000 * 1e6,
  silver: 5_000 * 1e6,
  gold: 25_000 * 1e6,
  platinum: 100_000 * 1e6,
} as const;

export type StakeTier = "none" | "bronze" | "silver" | "gold" | "platinum";

export interface StakeData {
  auditor: string;
  amount: number;
  unstakeRequestTime: number;
  unstakeRequestAmount: number;
  isRegistered: boolean;
}

export interface ChallengeData {
  challengeId: number;
  challenger: string;
  auditor: string;
  skillId: string;
  proofHash: number[];
  counterProofHash: number[];
  createdAt: number;
  respondedAt: number;
  status: { open?: object; responded?: object; slashed?: object; dismissed?: object };
  slashAmount: number;
}

/**
 * Calculate tier from raw token amount (6-decimal base units).
 */
export function calculateTier(amount: number): StakeTier {
  if (amount >= TIER_THRESHOLDS.platinum) return "platinum";
  if (amount >= TIER_THRESHOLDS.gold) return "gold";
  if (amount >= TIER_THRESHOLDS.silver) return "silver";
  if (amount >= TIER_THRESHOLDS.bronze) return "bronze";
  return "none";
}

/**
 * Calculate tier from whole-token amount (for Supabase compatibility).
 */
export function calculateTierFromTokens(tokens: number): StakeTier {
  return calculateTier(tokens * 1e6);
}

function getReadOnlyProvider(): AnchorProvider {
  const connection = getSolanaConnection();
  // Read-only provider — no wallet needed for account reads
  return new AnchorProvider(
    connection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { publicKey: PublicKey.default, signTransaction: async (tx: any) => tx, signAllTransactions: async (txs: any) => txs } as any,
    { commitment: "confirmed" }
  );
}

function getStakingProgram(): Program {
  const provider = getReadOnlyProvider();
  return new Program(vigilStakingIdl as any, provider);
}

function getChallengeProgram(): Program {
  const provider = getReadOnlyProvider();
  return new Program(vigilChallengeIdl as any, provider);
}

/**
 * Derive the StakeInfo PDA for an auditor.
 */
function getStakeInfoPda(auditorAddress: string): [PublicKey, number] {
  const auditor = new PublicKey(auditorAddress);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake"), auditor.toBuffer()],
    STAKING_PROGRAM_ID
  );
}

/**
 * Derive the Challenge PDA by challenge ID.
 */
function getChallengePda(challengeId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("challenge"), new BN(challengeId).toArrayLike(Buffer, "le", 8)],
    CHALLENGE_PROGRAM_ID
  );
}

/**
 * Read on-chain stake data for an auditor.
 * Returns null if the account doesn't exist (not staked).
 */
export async function getOnChainStake(auditorAddress: string): Promise<StakeData | null> {
  try {
    const program = getStakingProgram();
    const [pda] = getStakeInfoPda(auditorAddress);
    const account = await (program.account as any).stakeInfo.fetch(pda);

    return {
      auditor: (account as any).auditor.toBase58(),
      amount: (account as any).amount.toNumber(),
      unstakeRequestTime: (account as any).unstakeRequestTime.toNumber(),
      unstakeRequestAmount: (account as any).unstakeRequestAmount.toNumber(),
      isRegistered: (account as any).isRegistered,
    };
  } catch {
    // Account doesn't exist = not staked
    return null;
  }
}

/**
 * Read on-chain challenge data by ID.
 */
export async function getOnChainChallenge(challengeId: number): Promise<ChallengeData | null> {
  try {
    const program = getChallengeProgram();
    const [pda] = getChallengePda(challengeId);
    const account = await (program.account as any).challenge.fetch(pda);
    const a = account as any;

    return {
      challengeId: a.challengeId.toNumber(),
      challenger: a.challenger.toBase58(),
      auditor: a.auditor.toBase58(),
      skillId: a.skillId,
      proofHash: Array.from(a.proofHash),
      counterProofHash: Array.from(a.counterProofHash),
      createdAt: a.createdAt.toNumber(),
      respondedAt: a.respondedAt.toNumber(),
      status: a.status,
      slashAmount: a.slashAmount.toNumber(),
    };
  } catch {
    return null;
  }
}

/**
 * Check if staking programs are configured (program IDs set in env).
 */
export function isStakingConfigured(): boolean {
  return !!process.env.VIGIL_STAKING_PROGRAM_ID;
}

// Suppress unused import warning — bountyVaultIdl reserved for future use
void bountyVaultIdl;
