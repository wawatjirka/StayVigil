/**
 * $VIGIL Tokenomics Configuration
 * Total supply: 1,000,000,000 (1 billion)
 */

export const TOTAL_SUPPLY = 1_000_000_000;

export const ALLOCATIONS = {
  auditorRewards: {
    label: "Auditor Rewards Pool",
    percentage: 30,
    amount: TOTAL_SUPPLY * 0.3,
    vesting: "Released over 4 years via staking rewards",
  },
  bountyVault: {
    label: "Bounty Vault",
    percentage: 15,
    amount: TOTAL_SUPPLY * 0.15,
    vesting: "Released on successful challenges",
  },
  team: {
    label: "Team / Founder",
    percentage: 15,
    amount: TOTAL_SUPPLY * 0.15,
    vesting: "1-year cliff, 3-year linear vest",
  },
  community: {
    label: "Community / Airdrops",
    percentage: 15,
    amount: TOTAL_SUPPLY * 0.15,
    vesting: "Early users, beta auditors, skill creators",
  },
  liquidityPool: {
    label: "Liquidity Pool",
    percentage: 15,
    amount: TOTAL_SUPPLY * 0.15,
    vesting: "DEX liquidity on Base (Aerodrome/Uniswap)",
  },
  treasury: {
    label: "Treasury",
    percentage: 10,
    amount: TOTAL_SUPPLY * 0.1,
    vesting: "DAO-controlled for future development",
  },
} as const;

export const STAKING_TIERS = {
  bronze: { threshold: 1_000, label: "Bronze", audits: "basic" },
  silver: { threshold: 5_000, label: "Silver", audits: "standard" },
  gold: { threshold: 25_000, label: "Gold", audits: "high-risk" },
  platinum: { threshold: 100_000, label: "Platinum", audits: "enterprise" },
} as const;

/**
 * Revenue distribution from x402 scan payments
 */
export const REVENUE_SPLIT = {
  auditorReward: 70,   // % to the auditor who performed the scan
  bountyVault: 10,     // % to the bounty vault
  protocol: 20,        // % to protocol treasury
} as const;

/**
 * Slash distribution when a challenge succeeds
 */
export const SLASH_SPLIT = {
  challenger: 60,      // % to the successful challenger
  bountyVault: 20,     // % to the bounty vault
  burned: 20,          // % burned (removed from circulation)
} as const;
