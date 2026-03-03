import { NextRequest, NextResponse } from "next/server";
import { scanSkill } from "@/lib/scanner";
import { createServerClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { assignAudit } from "@/lib/marketplace/auditor";
import type { Finding } from "@/lib/database.types";

/** Free tier: return only the top 3 most severe failed findings */
function limitFindings(findings: Finding[]): Finding[] {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const failed = findings
    .filter((f) => !f.passed)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 3);
  const passed = findings.filter((f) => f.passed);
  return [...failed, ...passed];
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Maximum 10 free scans per day.",
          remaining: 0,
        },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": "0" },
        }
      );
    }

    // Parse request
    const body = await request.json();
    const { skillUrl } = body;

    if (!skillUrl || typeof skillUrl !== "string") {
      return NextResponse.json(
        { error: "Missing required field: skillUrl" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(skillUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL provided" },
        { status: 400 }
      );
    }

    // Check for cached result (scanned in last 24h)
    const supabase = createServerClient();
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: cached } = await supabase
      .from("skills")
      .select("*")
      .eq("url", skillUrl)
      .gte("scanned_at", twentyFourHoursAgo)
      .single();

    if (cached) {
      // Return cached result
      const { data: findings } = await supabase
        .from("scan_results")
        .select("*")
        .eq("skill_id", cached.id);

      const allFindings = (findings || []).map((f: Record<string, unknown>) => ({
          name: f.check_name as string,
          severity: f.severity as Finding["severity"],
          passed: f.passed as boolean,
          details: f.details as string,
        }));

      return NextResponse.json(
        {
          skillId: cached.id,
          skillName: cached.name,
          skillUrl: cached.url,
          score: cached.score,
          safe: cached.score >= 70,
          threshold: 70,
          findings: limitFindings(allFindings),
          scannedAt: cached.scanned_at,
          cached: true,
          tier: "free",
          note: "Free tier: Haiku AI + top 3 findings. Use POST /api/v1/scan with SOL or $VIGIL payment for Sonnet deep review + full report.",
        },
        {
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    // Run scan (free tier = Haiku LLM)
    const result = await scanSkill(skillUrl, "free");

    // Store in database
    const { data: skill, error: skillError } = await supabase
      .from("skills")
      .upsert(
        {
          url: result.skillUrl,
          name: result.skillName,
          raw_content: "",  // Don't store raw content for now to save space
          score: result.score,
          report: result.report,
          scanned_at: result.scannedAt,
        },
        { onConflict: "url" }
      )
      .select()
      .single();

    if (skillError || !skill) {
      console.error("Failed to store skill:", skillError);
      // Still return results even if storage fails
      return NextResponse.json(
        {
          skillName: result.skillName,
          skillUrl: result.skillUrl,
          score: result.score,
          safe: result.score >= 70,
          threshold: 70,
          findings: limitFindings(result.findings),
          scannedAt: result.scannedAt,
          cached: false,
          tier: "free",
          note: "Free tier: Haiku AI + top 3 findings. Use POST /api/v1/scan with SOL or $VIGIL payment for Sonnet deep review + full report.",
        },
        {
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    // Store findings
    const findingsToInsert = result.findings.map((f) => ({
      skill_id: skill.id,
      check_name: f.name,
      severity: f.severity,
      passed: f.passed,
      details: f.details,
    }));

    // Delete old findings for this skill first
    await supabase.from("scan_results").delete().eq("skill_id", skill.id);
    await supabase.from("scan_results").insert(findingsToInsert);

    // Fire-and-forget: assign auditors for this skill
    assignAudit(result.skillUrl, result.score).catch((err) =>
      console.error("Audit assignment failed:", err)
    );

    return NextResponse.json(
      {
        skillId: skill.id,
        skillName: result.skillName,
        skillUrl: result.skillUrl,
        score: result.score,
        safe: result.score >= 70,
        threshold: 70,
        findings: limitFindings(result.findings),
        scannedAt: result.scannedAt,
        cached: false,
        tier: "free",
        note: "Free tier: Haiku AI + top 3 findings. Use POST /api/v1/scan with SOL or $VIGIL payment for Sonnet deep review + full report.",
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    console.error("Scan error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
