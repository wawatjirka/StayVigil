import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get("skillId");
    const skillUrl = searchParams.get("url");

    if (!skillId && !skillUrl) {
      return NextResponse.json(
        { error: "Provide either skillId or url query parameter" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    let query = supabase.from("skills").select("*");
    if (skillId) {
      query = query.eq("id", skillId);
    } else {
      query = query.eq("url", skillUrl!);
    }

    const { data: skill, error } = await query.single();

    if (error || !skill) {
      return NextResponse.json(
        { error: "Skill not found. Scan it first via POST /api/scan" },
        { status: 404 }
      );
    }

    const { data: findings } = await supabase
      .from("scan_results")
      .select("*")
      .eq("skill_id", skill.id);

    return NextResponse.json({
      skillId: skill.id,
      skillName: skill.name,
      skillUrl: skill.url,
      score: skill.score,
      report: skill.report,
      findings: (findings || []).map((f) => ({
        name: f.check_name,
        severity: f.severity,
        passed: f.passed,
        details: f.details,
      })),
      scannedAt: skill.scanned_at,
    });
  } catch (error) {
    console.error("Score lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
