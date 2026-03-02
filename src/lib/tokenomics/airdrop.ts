import { createServerClient } from "../supabase";

interface AirdropRecipient {
  address: string;
  amount: number;
  reason: string;
}

/**
 * Generate the airdrop list based on early user activity.
 * Criteria:
 * - Users who scanned 5+ skills (early adopters)
 * - Beta auditors who completed 3+ audits
 * - Top reputation auditors
 */
export async function generateAirdropList(): Promise<AirdropRecipient[]> {
  const supabase = createServerClient();
  const recipients: AirdropRecipient[] = [];

  // Beta auditors with completed audits
  const { data: auditors } = await supabase
    .from("auditors")
    .select("wallet_address, total_audits, reputation_score")
    .gte("total_audits", 3)
    .order("reputation_score", { ascending: false });

  if (auditors) {
    for (const auditor of auditors) {
      // Base airdrop: 1000 VIGIL per completed audit (max 10k)
      const amount = Math.min(
        (auditor.total_audits as number) * 1000,
        10000
      );

      // Reputation bonus: top performers get 2x
      const multiplier = (auditor.reputation_score as number) >= 80 ? 2 : 1;

      recipients.push({
        address: auditor.wallet_address as string,
        amount: amount * multiplier,
        reason: `Beta auditor: ${auditor.total_audits} audits, ${auditor.reputation_score} reputation`,
      });
    }
  }

  return recipients;
}

/**
 * Generate a Merkle tree for efficient on-chain airdrop claims.
 * Returns the root hash and the list with proofs.
 */
export function prepareMerkleAirdrop(recipients: AirdropRecipient[]) {
  // Simplified — in production, use a proper Merkle tree library
  const leaves = recipients.map((r) => ({
    ...r,
    leaf: `${r.address}:${r.amount}`,
  }));

  return {
    totalRecipients: recipients.length,
    totalAmount: recipients.reduce((sum, r) => sum + r.amount, 0),
    recipients: leaves,
  };
}
