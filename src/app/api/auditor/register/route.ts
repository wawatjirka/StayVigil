import { NextRequest, NextResponse } from "next/server";
import { registerAuditor } from "@/lib/marketplace/auditor";

/**
 * POST /api/auditor/register — Register as an auditor after staking on-chain.
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, stakeAmount } = await request.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Missing walletAddress" },
        { status: 400 }
      );
    }

    if (!stakeAmount || typeof stakeAmount !== "number" || stakeAmount < 1000) {
      return NextResponse.json(
        { error: "Minimum stake is 1,000 $VIGIL" },
        { status: 400 }
      );
    }

    const auditor = await registerAuditor(walletAddress, stakeAmount);

    return NextResponse.json({
      message: "Auditor registered successfully",
      auditor,
    });
  } catch (error) {
    console.error("Auditor registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
