import { NextRequest, NextResponse } from "next/server";
import { registerAuditor } from "@/lib/marketplace/auditor";
import { getChainAdapter, isValidChainId } from "@/lib/chain";

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/auditor/register — Register as an auditor with wallet signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, message, timestamp, chain: rawChain } =
      await request.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Missing walletAddress" },
        { status: 400 }
      );
    }

    // Validate chain parameter (defaults to "solana")
    const chain = rawChain || "solana";
    if (!isValidChainId(chain)) {
      return NextResponse.json(
        { error: `Unsupported chain: ${chain}` },
        { status: 400 }
      );
    }

    const adapter = getChainAdapter(chain);

    if (!adapter.isValidAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
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

    // Verify signature (async for Base/EIP-191, sync for Solana/Ed25519)
    const valid = await adapter.verifySignature(walletAddress, message, signature);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid wallet signature" },
        { status: 401 }
      );
    }

    // Check on-chain stake first, fallback to token balance
    let stakeAmount = 1000; // Default bronze minimum (demo mode)

    if (adapter.isStakingConfigured()) {
      const stakeData = await adapter.getStake(walletAddress);
      if (stakeData && stakeData.amount > 0) {
        stakeAmount = stakeData.amount;
      } else {
        const balance = await adapter.getTokenBalance(walletAddress);
        stakeAmount = balance ?? 1000;
      }
    } else {
      const balance = await adapter.getTokenBalance(walletAddress);
      stakeAmount = balance ?? 1000;
    }

    const auditor = await registerAuditor(walletAddress, stakeAmount, chain);

    return NextResponse.json({
      message: "Auditor registered successfully",
      auditor,
      demoMode: !adapter.isStakingConfigured(),
    });
  } catch (error) {
    console.error("Auditor registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
