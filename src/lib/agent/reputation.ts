import { getSolana8004SDK, getVigilAssetPubkey } from "./identity";
import { PublicKey } from "@solana/web3.js";

export interface FeedbackData {
  accuracy: number;   // 0-100
  responseTime: number; // 0-100
  uptime: number;     // 0-100
  comment?: string;
}

/**
 * Submit feedback for an agent's scan quality.
 * Score is a composite of accuracy, responseTime, uptime (averaged to 0-100).
 */
export async function submitFeedback(agentId: string, feedback: FeedbackData) {
  const sdk = getSolana8004SDK();

  const score = Math.round(
    (feedback.accuracy + feedback.responseTime + feedback.uptime) / 3
  );

  // agentId is the asset pubkey (base58)
  const assetPubkey = typeof agentId === "string" && agentId.length > 10
    ? agentId
    : getVigilAssetPubkey();

  if (!assetPubkey) {
    throw new Error("No asset pubkey available for feedback");
  }

  const result = await sdk.giveFeedback(new PublicKey(assetPubkey), {
    value: score,
    tag1: "skill-scan",
    tag2: "",
    feedbackUri: feedback.comment || "",
  });

  return result;
}

/**
 * Get reputation summary for an agent by asset pubkey.
 * Returns { averageScore, totalFeedbacks }.
 */
export async function getReputationSummary(agentId: string) {
  const sdk = getSolana8004SDK();

  const assetPubkey = typeof agentId === "string" && agentId.length > 10
    ? agentId
    : getVigilAssetPubkey();

  if (!assetPubkey) return null;

  try {
    const summary = await sdk.getSummary(new PublicKey(assetPubkey));
    return summary;
  } catch {
    return null;
  }
}

/**
 * Get all feedback entries for an agent.
 * Note: Per-entry feedback requires an indexer; returns summary data.
 */
export async function getAllFeedback(agentId: string) {
  const summary = await getReputationSummary(agentId);
  if (!summary) return [];

  // 8004-solana returns aggregate data, not individual entries
  return {
    totalFeedbacks: summary.totalFeedbacks,
    averageScore: summary.averageScore,
  };
}
