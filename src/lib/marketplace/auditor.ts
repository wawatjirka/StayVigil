import { createServerClient } from "../supabase";

export interface Auditor {
  id: string;
  wallet_address: string;
  stake_amount: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  reputation_score: number;
  total_audits: number;
  active: boolean;
  registered_at: string;
}

export interface AuditAssignment {
  id: string;
  skill_url: string;
  auditor_id: string;
  status: "assigned" | "in_progress" | "completed" | "disputed";
  score: number | null;
  report: string | null;
  assigned_at: string;
  completed_at: string | null;
}

const TIER_THRESHOLDS = {
  bronze: 1000,
  silver: 5000,
  gold: 25000,
  platinum: 100000,
};

function getTier(stakeAmount: number): Auditor["tier"] {
  if (stakeAmount >= TIER_THRESHOLDS.platinum) return "platinum";
  if (stakeAmount >= TIER_THRESHOLDS.gold) return "gold";
  if (stakeAmount >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

/**
 * Register a new auditor after they've staked on-chain.
 */
export async function registerAuditor(
  walletAddress: string,
  stakeAmount: number
) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("auditors")
    .upsert(
      {
        wallet_address: walletAddress.toLowerCase(),
        stake_amount: stakeAmount,
        tier: getTier(stakeAmount),
        reputation_score: 50, // Start at neutral
        total_audits: 0,
        active: true,
        registered_at: new Date().toISOString(),
      },
      { onConflict: "wallet_address" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get available auditors ranked by reputation, filtered by minimum tier.
 */
export async function getAvailableAuditors(
  minTier: Auditor["tier"] = "bronze"
): Promise<Auditor[]> {
  const supabase = createServerClient();

  const minStake = TIER_THRESHOLDS[minTier];

  const { data, error } = await supabase
    .from("auditors")
    .select("*")
    .eq("active", true)
    .gte("stake_amount", minStake)
    .order("reputation_score", { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as Auditor[];
}

/**
 * Assign a skill audit to the top-ranked available auditor(s).
 * For high-risk skills (score < 40 from initial scan), assign 3+ auditors.
 */
export async function assignAudit(
  skillUrl: string,
  initialScore?: number
): Promise<AuditAssignment[]> {
  const isHighRisk = initialScore !== undefined && initialScore < 40;
  const numAuditors = isHighRisk ? 3 : 1;

  const auditors = await getAvailableAuditors(isHighRisk ? "silver" : "bronze");

  if (auditors.length === 0) {
    throw new Error("No available auditors");
  }

  const supabase = createServerClient();
  const selectedAuditors = auditors.slice(0, numAuditors);

  const assignments: AuditAssignment[] = [];

  for (const auditor of selectedAuditors) {
    const { data, error } = await supabase
      .from("audit_assignments")
      .insert({
        skill_url: skillUrl,
        auditor_id: auditor.id,
        status: "assigned",
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    assignments.push(data as unknown as AuditAssignment);
  }

  return assignments;
}

/**
 * Calculate consensus score from multiple auditor reports.
 * Weighted by auditor reputation.
 */
export function calculateConsensusScore(
  audits: Array<{ score: number; reputationScore: number }>
): { score: number; agreement: number } {
  if (audits.length === 0) return { score: 0, agreement: 0 };
  if (audits.length === 1) return { score: audits[0].score, agreement: 1 };

  const totalWeight = audits.reduce((sum, a) => sum + a.reputationScore, 0);
  const weightedScore = audits.reduce(
    (sum, a) => sum + a.score * (a.reputationScore / totalWeight),
    0
  );

  // Calculate agreement: 1 = perfect agreement, 0 = max disagreement
  const mean = audits.reduce((sum, a) => sum + a.score, 0) / audits.length;
  const variance =
    audits.reduce((sum, a) => sum + Math.pow(a.score - mean, 2), 0) /
    audits.length;
  const maxVariance = 50 * 50; // Max possible variance (0 vs 100)
  const agreement = 1 - Math.sqrt(variance) / Math.sqrt(maxVariance);

  return {
    score: Math.round(weightedScore),
    agreement: Math.round(agreement * 100) / 100,
  };
}

/**
 * Get dashboard data for an auditor.
 */
export async function getAuditorDashboard(walletAddress: string) {
  const supabase = createServerClient();

  const { data: auditor } = await supabase
    .from("auditors")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

  if (!auditor) return null;

  const { data: assignments } = await supabase
    .from("audit_assignments")
    .select("*")
    .eq("auditor_id", auditor.id)
    .order("assigned_at", { ascending: false })
    .limit(20);

  const { count: activeCount } = await supabase
    .from("audit_assignments")
    .select("*", { count: "exact", head: true })
    .eq("auditor_id", auditor.id)
    .in("status", ["assigned", "in_progress"]);

  const { count: completedCount } = await supabase
    .from("audit_assignments")
    .select("*", { count: "exact", head: true })
    .eq("auditor_id", auditor.id)
    .eq("status", "completed");

  return {
    auditor,
    activeAudits: activeCount || 0,
    completedAudits: completedCount || 0,
    recentAssignments: assignments || [],
  };
}
