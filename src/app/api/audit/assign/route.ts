import { NextRequest, NextResponse } from "next/server";
import { assignAudit } from "@/lib/marketplace/auditor";

/**
 * POST /api/audit/assign — Assign auditors to review a skill.
 */
export async function POST(request: NextRequest) {
  try {
    const { skillUrl, initialScore } = await request.json();

    if (!skillUrl || typeof skillUrl !== "string") {
      return NextResponse.json(
        { error: "Missing skillUrl" },
        { status: 400 }
      );
    }

    const assignments = await assignAudit(skillUrl, initialScore);

    return NextResponse.json({
      message: `Assigned to ${assignments.length} auditor(s)`,
      assignments,
    });
  } catch (error) {
    console.error("Audit assignment error:", error);
    const message =
      error instanceof Error ? error.message : "Assignment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
