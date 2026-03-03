import { NextRequest, NextResponse } from "next/server";
import { submitAudit } from "@/lib/marketplace/auditor";

/**
 * POST /api/audit/submit — Submit an audit result.
 */
export async function POST(request: NextRequest) {
  try {
    const { assignmentId, walletAddress, score, report } = await request.json();

    if (!assignmentId || typeof assignmentId !== "string") {
      return NextResponse.json(
        { error: "Missing assignmentId" },
        { status: 400 }
      );
    }

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Missing walletAddress" },
        { status: 400 }
      );
    }

    if (typeof score !== "number" || score < 0 || score > 100) {
      return NextResponse.json(
        { error: "Score must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    if (!report || typeof report !== "string") {
      return NextResponse.json(
        { error: "Missing report" },
        { status: 400 }
      );
    }

    const result = await submitAudit(assignmentId, walletAddress, score, report);

    return NextResponse.json({
      message: "Audit submitted successfully",
      assignment: result.assignment,
      consensus: result.consensus,
    });
  } catch (error) {
    console.error("Audit submission error:", error);
    const message =
      error instanceof Error ? error.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
