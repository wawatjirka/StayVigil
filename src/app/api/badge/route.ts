import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/badge?url=... — Get a trust badge for a skill (for SkillsMP integration).
 * Returns JSON with score, level, and badge URL.
 */
export async function GET(request: NextRequest) {
  try {
    const skillUrl = request.nextUrl.searchParams.get("url");

    if (!skillUrl) {
      return NextResponse.json(
        { error: "Provide url query parameter" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data: skill } = await supabase
      .from("skills")
      .select("id, name, score, scanned_at")
      .eq("url", skillUrl)
      .single();

    if (!skill || skill.score === null) {
      return NextResponse.json({
        verified: false,
        message: "Skill not yet scanned by StayVigil",
      });
    }

    let level: string;
    let color: string;
    if (skill.score >= 70) {
      level = "safe";
      color = "#22c55e";
    } else if (skill.score >= 40) {
      level = "caution";
      color = "#eab308";
    } else {
      level = "danger";
      color = "#ef4444";
    }

    return NextResponse.json({
      verified: true,
      skillName: skill.name,
      score: skill.score,
      level,
      color,
      scannedAt: skill.scanned_at,
      badgeUrl: `https://img.shields.io/badge/Vigil-${skill.score}%2F100-${color.replace("#", "")}`,
      detailsUrl: `/api/score?url=${encodeURIComponent(skillUrl)}`,
    });
  } catch (error) {
    console.error("Badge error:", error);
    return NextResponse.json(
      { error: "Failed to generate badge" },
      { status: 500 }
    );
  }
}
