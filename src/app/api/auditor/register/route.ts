import { NextRequest, NextResponse } from "next/server";
import { registerAuditor } from "@/lib/marketplace/auditor";
import {
  isValidSolanaAddress,
  verifyWalletSignature,
  getVigilTokenBalance,
} from "@/lib/solana-verify";
import { getOnChainStake, isStakingConfigured } from "@/lib/solana-programs";

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/auditor/register — Register as an auditor with wallet signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, message, timestamp } =
      await request.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Missing walletAddress" },
        { status: 400 }
      );
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid Solana wallet address" },
        { status: 400 }
      );
    }

    if (!signature || !message || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature, message, or timestamp" },
        { status: 400 }
      );
    }

    // Validate timestamp freshness
    const age = Date.now() - timestamp;
    if (age > SIGNATURE_MAX_AGE_MS || age < 0) {
      return NextResponse.json(
        { error: "Signature expired — please try again" },
        { status: 400 }
      );
    }

    // Validate message format
    const expectedMessage = `Vigil Protocol auditor registration: ${walletAddress}:${timestamp}`;
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    // Verify Ed25519 signature
    const valid = verifyWalletSignature(walletAddress, message, signature);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid wallet signature" },
        { status: 401 }
      );
    }

    // Check on-chain stake first (Anchor program), fallback to token balance
    let stakeAmount = 1000; // Default bronze minimum (demo mode)

    if (isStakingConfigured()) {
      const stakeData = await getOnChainStake(walletAddress);
      if (stakeData && stakeData.amount > 0) {
        // Trust on-chain stake (amount is in 6-decimal base units, convert to whole tokens)
        stakeAmount = stakeData.amount / 1e6;
      } else {
        // No on-chain stake — fallback to token balance check
        const balance = await getVigilTokenBalance(walletAddress);
        stakeAmount = balance ?? 1000;
      }
    } else {
      // Staking program not deployed — use token balance (demo mode)
      const balance = await getVigilTokenBalance(walletAddress);
      stakeAmount = balance ?? 1000;
    }

    const auditor = await registerAuditor(walletAddress, stakeAmount);

    return NextResponse.json({
      message: "Auditor registered successfully",
      auditor,
      demoMode: !isStakingConfigured(),
    });
  } catch (error) {
    console.error("Auditor registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
