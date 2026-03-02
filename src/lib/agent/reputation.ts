import { getERC8004Client } from "./identity";

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
export async function submitFeedback(agentId: number, feedback: FeedbackData) {
  const client = getERC8004Client();
  const score = Math.round(
    (feedback.accuracy + feedback.responseTime + feedback.uptime) / 3
  );

  const tx = await client.reputation.giveFeedback({
    agentId: BigInt(agentId),
    score,
    tag1: "skill-scan",
    tag2: "",
    endpoint: "",
    feedbackURI: feedback.comment || "",
  });
  return tx;
}

/**
 * Get reputation summary for an agent by ID.
 */
export async function getReputationSummary(agentId: number) {
  const client = getERC8004Client();
  try {
    const summary = await client.reputation.getSummary(BigInt(agentId));
    return summary;
  } catch {
    return null;
  }
}

/**
 * Get all feedback entries for an agent.
 */
export async function getAllFeedback(agentId: number) {
  const client = getERC8004Client();
  try {
    const feedback = await client.reputation.readAllFeedback(BigInt(agentId));
    return feedback;
  } catch {
    return [];
  }
}
