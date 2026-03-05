import { NextRequest, NextResponse } from "next/server";
import { scanSkill } from "@/lib/scanner";
import { createServerClient } from "@/lib/supabase";
import { assignAudit } from "@/lib/marketplace/auditor";
import { verifySolPayment, verifyVigilPayment } from "@/lib/solana-verify";
import {
  getTreasuryWallet,
  getTokenMint,
  getScanPriceSol,
  getScanPriceVigil,
} from "@/lib/solana";

/**
 * Paid scan endpoint — full report with all findings.
 * Accepts SOL or SPL token payment on Solana.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillUrl, txSignature, paymentType } = body;

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

    // If no transaction signature, return 402 with payment details
    if (!txSignature) {
      const treasury = getTreasuryWallet();
      const mint = getTokenMint();
      return NextResponse.json(
        {
          error: "Payment required",
          payment: {
            treasury: treasury?.toBase58() ?? null,
            mint: mint?.toBase58() ?? null,
            priceSol: getScanPriceSol(),
            priceVigil: getScanPriceVigil(),
            network: "solana",
            description:
              "Full security scan of an AI agent skill — includes all findings, severity breakdown, and recommendation.",
          },
        },
        { status: 402 }
      );
    }

    // Verify payment on-chain
    const type = paymentType === "vigil" ? "vigil" : "sol";
    const verification =
      type === "vigil"
        ? await verifyVigilPayment(txSignature)
        : await verifySolPayment(txSignature);

    if (!verification.verified) {
      return NextResponse.json(
        { error: `Payment verification failed: ${verification.error}` },
        { status: 402 }
      );
    }

    // Check for duplicate transaction signature (prevent replay)
    const supabase = createServerClient();

    const { data: existingTx } = await supabase
      .from("used_tx_signatures")
      .select("id")
      .eq("tx_signature", txSignature)
      .single();

    if (existingTx) {
      return NextResponse.json(
        { error: "Transaction signature already used" },
        { status: 409 }
      );
    }

    // Record the transaction signature
    await supabase.from("used_tx_signatures").insert({
      tx_signature: txSignature,
      payment_type: type,
      skill_url: skillUrl,
    });

    // Check for cached result (scanned in last 24h)
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
        safe: cached.score >= 70,
        threshold: 70,
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

    // Fire-and-forget: assign auditors for this skill
    assignAudit(result.skillUrl, result.score).catch((err) =>
      console.error("Audit assignment failed:", err)
    );

    return NextResponse.json({
      skillId: skill?.id,
      ...result,
      safe: result.score >= 70,
      threshold: 70,
      paid: true,
      cached: false,
    });
  } catch (error) {
    console.error("Paid scan error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
