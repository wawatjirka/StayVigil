import { NextResponse } from "next/server";
import {
  generateAirdropList,
  prepareMerkleAirdrop,
} from "@/lib/tokenomics/airdrop";
import { ALLOCATIONS } from "@/lib/tokenomics/config";

/**
 * GET /api/airdrop — Preview the airdrop distribution.
 */
export async function GET() {
  try {
    const recipients = await generateAirdropList();
    const merkle = prepareMerkleAirdrop(recipients);

    return NextResponse.json({
      allocation: ALLOCATIONS.community,
      airdrop: {
        totalRecipients: merkle.totalRecipients,
        totalAmount: merkle.totalAmount,
        maxPerRecipient: 20000,
        recipients: merkle.recipients.slice(0, 50), // Preview first 50
      },
    });
  } catch (error) {
    console.error("Airdrop generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate airdrop list" },
      { status: 500 }
    );
  }
}
