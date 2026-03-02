import { fetchSkill } from "../fetcher";
import { runStaticAnalysis } from "./static-analysis";
import { runLLMReview, type ScanTier } from "./llm-review";
import { calculateScore, generateReport } from "./score";
import type { Finding } from "../database.types";

export interface ScanResponse {
  skillName: string;
  skillUrl: string;
  score: number;
  report: string;
  findings: Finding[];
  scannedAt: string;
}

export async function scanSkill(
  skillUrl: string,
  tier: ScanTier = "free"
): Promise<ScanResponse> {
  // 1. Fetch and parse the skill
  const skill = await fetchSkill(skillUrl);

  // 2. Run static analysis
  const staticFindings = runStaticAnalysis(skill.rawContent, skill.frontmatter);

  // 3. Run LLM review (Haiku for free, Sonnet for paid)
  const llmFindings = await runLLMReview(skill.rawContent, tier);

  // 4. Combine all findings
  const allFindings = [...staticFindings, ...llmFindings];

  // 5. Calculate score and generate report
  const score = calculateScore(allFindings);
  const report = generateReport(score, allFindings);

  return {
    skillName: skill.name,
    skillUrl: skill.url,
    score,
    report,
    findings: allFindings,
    scannedAt: new Date().toISOString(),
  };
}
