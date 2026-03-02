import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { scanSkill } from "@/lib/scanner";
import { createServerClient } from "@/lib/supabase";
import { getX402Server, SCAN_PRICE, NETWORK, PAY_TO } from "@/lib/x402";

/**
 * Paid scan endpoint — full report with all findings.
 * Protected by x402 micropayment ($0.02 USDC on Base).
 */
const handler = async (request: NextRequest): Promise<NextResponse<unknown>> => {
  try {
    const body = await request.json();
    const { skillUrl } = body;

    if (!skillUrl || typeof skillUrl !== "string") {
      return NextResponse.json(
        { error: "Missing required field: skillUrl" },
        { status: 400 }
      );
    }

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
      const { data: findings } = await supabase
        .from("scan_results")
        .select("*")
        .eq("skill_id", cached.id);

      return NextResponse.json({
        skillId: cached.id,
        skillName: cached.name,
        skillUrl: cached.url,
        score: cached.score,
        report: cached.report,
        findings: (findings || []).map((f: Record<string, unknown>) => ({
          name: f.check_name,
          severity: f.severity,
          passed: f.passed,
          details: f.details,
        })),
        scannedAt: cached.scanned_at,
        paid: true,
        cached: true,
      });
    }

    // Run full scan (paid tier = Sonnet deep review)
    const result = await scanSkill(skillUrl, "paid");

    // Store in database
    const { data: skill } = await supabase
      .from("skills")
      .upsert(
        {
          url: result.skillUrl,
          name: result.skillName,
          raw_content: "",
          score: result.score,
          report: result.report,
          scanned_at: result.scannedAt,
        },
        { onConflict: "url" }
      )
      .select()
      .single();

    if (skill) {
      const findingsToInsert = result.findings.map((f) => ({
        skill_id: skill.id,
        check_name: f.name,
        severity: f.severity,
        passed: f.passed,
        details: f.details,
      }));

      await supabase.from("scan_results").delete().eq("skill_id", skill.id);
      await supabase.from("scan_results").insert(findingsToInsert);
    }

    return NextResponse.json({
      skillId: skill?.id,
      ...result,
      paid: true,
      cached: false,
    });
  } catch (error) {
    console.error("Paid scan error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const POST = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: SCAN_PRICE,
      network: NETWORK,
      payTo: PAY_TO,
    },
    description: "Full security scan of an AI agent skill — includes all findings, severity breakdown, and recommendation.",
  },
  getX402Server()
);
