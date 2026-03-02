import { createServerClient } from "./supabase";

const MAX_SCANS_PER_DAY = 10;

export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const supabase = createServerClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get or create rate limit record
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("*")
    .eq("ip_address", ip)
    .single();

  if (!existing) {
    // First request from this IP
    await supabase.from("rate_limits").insert({
      ip_address: ip,
      scans_today: 1,
      last_reset: todayStart.toISOString(),
    });
    return { allowed: true, remaining: MAX_SCANS_PER_DAY - 1 };
  }

  // Check if we need to reset (new day)
  const lastReset = new Date(existing.last_reset);
  if (lastReset < todayStart) {
    await supabase
      .from("rate_limits")
      .update({
        scans_today: 1,
        last_reset: todayStart.toISOString(),
      })
      .eq("ip_address", ip);
    return { allowed: true, remaining: MAX_SCANS_PER_DAY - 1 };
  }

  // Check count
  if (existing.scans_today >= MAX_SCANS_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  // Increment
  await supabase
    .from("rate_limits")
    .update({ scans_today: existing.scans_today + 1 })
    .eq("ip_address", ip);

  return {
    allowed: true,
    remaining: MAX_SCANS_PER_DAY - existing.scans_today - 1,
  };
}
