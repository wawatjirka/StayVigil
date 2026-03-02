import { NextRequest, NextResponse } from "next/server";
import { getReputationSummary, getAllFeedback } from "@/lib/agent/reputation";
import { getVigilIdentity } from "@/lib/agent/identity";

/**
 * GET /api/reputation?agentId=1 — View an agent's on-chain reputation.
 */
export async function GET(request: NextRequest) {
  try {
    const agentId = Number(request.nextUrl.searchParams.get("agentId") || "0");

    if (!agentId) {
      return NextResponse.json(
        { error: "Provide agentId query parameter" },
        { status: 400 }
      );
    }

    if (!process.env.VIGIL_AGENT_PRIVATE_KEY) {
      return NextResponse.json({
        message: "Agent identity not configured. Set VIGIL_AGENT_PRIVATE_KEY and ERC8004 contract addresses.",
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
      feedbackCount: Array.isArray(feedback) ? feedback.length : 0,
      recentFeedback: Array.isArray(feedback) ? feedback.slice(-10) : [],
    });
  } catch (error) {
    console.error("Reputation fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reputation data" },
      { status: 500 }
    );
  }
}
