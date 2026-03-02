import type { Finding } from "../database.types";

const SEVERITY_WEIGHTS: Record<Finding["severity"], number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 0,
};

/**
 * Calculate a composite trust score from 0-100.
 * 100 = perfectly safe, 0 = extremely dangerous.
 * Each failed check deducts points based on severity.
 */
export function calculateScore(findings: Finding[]): number {
  const failedFindings = findings.filter((f) => !f.passed);

  if (failedFindings.length === 0) return 100;

  const totalDeduction = failedFindings.reduce(
    (sum, f) => sum + SEVERITY_WEIGHTS[f.severity],
    0
  );

  return Math.max(0, 100 - totalDeduction);
}

/**
 * Generate a human-readable report summary.
 */
export function generateReport(score: number, findings: Finding[]): string {
  const failed = findings.filter((f) => !f.passed);
  const passed = findings.filter((f) => f.passed);

  let verdict: string;
  if (score >= 80) {
    verdict = "LOW RISK — This skill appears safe for use.";
  } else if (score >= 50) {
    verdict = "MEDIUM RISK — This skill has some concerning patterns. Review findings before installing.";
  } else if (score >= 20) {
    verdict = "HIGH RISK — This skill contains multiple security concerns. Not recommended for use.";
  } else {
    verdict = "CRITICAL RISK — This skill shows strong indicators of malicious intent. Do not install.";
  }

  const sections = [
    `# Vigil Security Report`,
    ``,
    `**Trust Score: ${score}/100**`,
    ``,
    `**Verdict:** ${verdict}`,
    ``,
  ];

  if (failed.length > 0) {
    sections.push(`## Findings (${failed.length} issues)`);
    sections.push(``);
    for (const f of failed) {
      sections.push(`### [${f.severity.toUpperCase()}] ${f.name}`);
      sections.push(f.details);
      sections.push(``);
    }
  }

  if (passed.length > 0) {
    sections.push(`## Passed Checks (${passed.length})`);
    sections.push(``);
    for (const f of passed) {
      sections.push(`- **${f.name}**: ${f.details}`);
    }
  }

  return sections.join("\n");
}

export type ScoreLevel = "safe" | "caution" | "danger";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 70) return "safe";
  if (score >= 40) return "caution";
  return "danger";
}
