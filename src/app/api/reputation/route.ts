import { NextRequest, NextResponse } from "next/server";
import { getReputationSummary, getAllFeedback } from "@/lib/agent/reputation";
import { getVigilIdentity } from "@/lib/agent/identity";

/**
 * GET /api/reputation?agentId=1 — View an agent's on-chain reputation.
 */
export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId") || "";

    if (!agentId) {
      return NextResponse.json(
        { error: "Provide agentId query parameter (asset pubkey or numeric ID)" },
        { status: 400 }
      );
    }

    if (!process.env.VIGIL_AGENT_KEYPAIR) {
      return NextResponse.json({
        message: "Agent identity not configured. Set VIGIL_AGENT_KEYPAIR and SOLANA_8004_CLUSTER.",
        identity: null,
        reputation: null,
      });
    }

    const [identity, reputation, feedback] = await Promise.all([
      getVigilIdentity(agentId),
      getReputationSummary(agentId),
      getAllFeedback(agentId),
    ]);

    return NextResponse.json({
      identity,
      reputation,
      feedbackCount: feedback && typeof feedback === "object" && "totalFeedbacks" in feedback
        ? feedback.totalFeedbacks
        : 0,
      averageScore: feedback && typeof feedback === "object" && "averageScore" in feedback
        ? feedback.averageScore
        : null,
    });
  } catch (error) {
    console.error("Reputation fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reputation data" },
      { status: 500 }
    );
  }
}
