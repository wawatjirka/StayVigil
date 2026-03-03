import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/audit/status?skillUrl=... — Get audit status for a skill.
 */
export async function GET(request: NextRequest) {
  try {
    const skillUrl = request.nextUrl.searchParams.get("skillUrl");

    if (!skillUrl) {
      return NextResponse.json(
        { error: "Missing skillUrl query parameter" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: assignments } = await supabase
      .from("audit_assignments")
      .select("*")
      .eq("skill_url", skillUrl)
      .order("assigned_at", { ascending: false });

    const allAssignments = assignments || [];
    const totalAssigned = allAssignments.length;
    const totalCompleted = allAssignments.filter(
      (a: Record<string, unknown>) => a.status === "completed"
    ).length;

    // Get consensus score from skills table if all audits are done
    let consensusScore: number | null = null;
    let agreement: number | null = null;

    if (totalAssigned > 0 && totalCompleted === totalAssigned) {
      const { data: skill } = await supabase
        .from("skills")
        .select("score")
        .eq("url", skillUrl)
        .single();

      if (skill) {
        consensusScore = (skill as Record<string, unknown>).score as number;
      }
    }

    return NextResponse.json({
      totalAssigned,
      totalCompleted,
      consensusScore,
      agreement,
      assignments: allAssignments,
    });
  } catch (error) {
    console.error("Audit status error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
