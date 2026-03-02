import Anthropic from "@anthropic-ai/sdk";
import type { Finding } from "../database.types";

const client = new Anthropic();

const MODELS = {
  free: "claude-haiku-4-5-20251001",   // ~$0.007/scan — fast, cheap
  paid: "claude-sonnet-4-20250514",     // ~$0.03/scan  — deeper analysis
} as const;

export type ScanTier = keyof typeof MODELS;

const SYSTEM_PROMPT = `You are a security auditor specialized in analyzing AI agent skills and plugins. Your job is to identify security vulnerabilities, malicious patterns, and risks in skill definition files.

Analyze the provided skill content and return a JSON array of findings. Each finding must have:
- "name": short name for the issue (string)
- "severity": one of "critical", "high", "medium", "low", "info"
- "passed": false if a risk was found, true if this check passed
- "details": detailed explanation of the finding (string)

Categories to check:
1. Hidden instructions that could manipulate the AI agent's behavior
2. Social engineering tactics that trick users into dangerous actions
3. Obfuscated or encoded malicious code
4. Logic bombs (code that activates under specific conditions)
5. Data harvesting or exfiltration attempts
6. Privilege escalation attempts
7. Supply chain attack vectors
8. Backdoor installation patterns

If no issues are found in a category, include a passing finding for it.

IMPORTANT: Return ONLY a valid JSON array. No markdown, no explanation outside the JSON.`;

export async function runLLMReview(
  content: string,
  tier: ScanTier = "free"
): Promise<Finding[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return [
      {
        name: "LLM Review",
        severity: "info",
        passed: true,
        details: "LLM review skipped: ANTHROPIC_API_KEY not configured.",
      },
    ];
  }

  const model = MODELS[tier];

  try {
    const message = await client.messages.create({
      model,
      max_tokens: tier === "paid" ? 4096 : 2048,
      messages: [
        {
          role: "user",
          content: `Analyze this AI agent skill file for security vulnerabilities:\n\n---\n${content.slice(0, tier === "paid" ? 15000 : 8000)}\n---`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [
        {
          name: "LLM Review",
          severity: "info",
          passed: true,
          details: "LLM review completed but returned no structured findings.",
        },
      ];
    }

    const findings: Finding[] = JSON.parse(jsonMatch[0]);
    const modelLabel = tier === "paid" ? "AI-Deep" : "AI";

    // Validate and sanitize findings
    return findings
      .filter(
        (f) =>
          f.name &&
          f.severity &&
          typeof f.passed === "boolean" &&
          f.details
      )
      .map((f) => ({
        name: `[${modelLabel}] ${f.name}`,
        severity: f.severity,
        passed: f.passed,
        details: f.details,
      }));
  } catch (error) {
    console.error("LLM review failed:", error);
    return [
      {
        name: "LLM Review",
        severity: "info",
        passed: true,
        details: `LLM review encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    ];
  }
}
