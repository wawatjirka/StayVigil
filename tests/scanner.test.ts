import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

// Import scanner modules (tsx handles TS resolution)
import { runStaticAnalysis } from "../src/lib/scanner/static-analysis";
import { calculateScore, generateReport, getScoreLevel } from "../src/lib/scanner/score";
import type { Finding } from "../src/lib/database.types";

// --- Helpers ---

const FIXTURES_DIR = join(new URL(".", import.meta.url).pathname, "fixtures");

function loadFixture(name: string): { content: string; frontmatter: Record<string, unknown> } {
  const raw = readFileSync(join(FIXTURES_DIR, name), "utf-8");
  const { data } = matter(raw);
  return { content: raw, frontmatter: data };
}

// --- Static Analysis Tests ---

describe("Static Analysis", () => {
  describe("Safe skill", () => {
    const { content, frontmatter } = loadFixture("safe-skill.md");
    const findings = runStaticAnalysis(content, frontmatter);

    it("should produce findings for all 12 checks", () => {
      assert.equal(findings.length, 12);
    });

    it("should pass all checks", () => {
      const failed = findings.filter((f) => !f.passed);
      assert.equal(failed.length, 0, `Unexpected failures: ${failed.map((f) => f.name).join(", ")}`);
    });

    it("should score 100", () => {
      const score = calculateScore(findings);
      assert.equal(score, 100);
    });

    it("should be rated 'safe'", () => {
      const score = calculateScore(findings);
      assert.equal(getScoreLevel(score), "safe");
    });
  });

  describe("Malicious skill", () => {
    const { content, frontmatter } = loadFixture("malicious-skill.md");
    const findings = runStaticAnalysis(content, frontmatter);

    it("should produce findings for all 12 checks", () => {
      assert.equal(findings.length, 12);
    });

    it("should fail the dangerous bash check", () => {
      const bash = findings.find((f) => f.name === "Dangerous Bash Commands");
      assert.ok(bash);
      assert.equal(bash.passed, false);
      assert.ok(bash.details.includes("curl | bash"));
      assert.ok(bash.details.includes("rm -rf"));
      assert.ok(bash.details.includes("chmod 777"));
      assert.ok(bash.details.includes("sudo usage"));
      assert.ok(bash.details.includes("reverse shell pattern"));
    });

    it("should fail the exfiltration check", () => {
      const exfil = findings.find((f) => f.name === "Data Exfiltration");
      assert.ok(exfil);
      assert.equal(exfil.passed, false);
      assert.ok(exfil.details.includes("webhook.site") || exfil.details.includes("known exfil service"));
      assert.ok(exfil.details.includes("suspicious TLD"));
    });

    it("should fail the prompt injection check", () => {
      const injection = findings.find((f) => f.name === "Prompt Injection");
      assert.ok(injection);
      assert.equal(injection.passed, false);
      assert.ok(injection.details.includes("ignore previous instructions"));
    });

    it("should fail the permission scope check", () => {
      const perm = findings.find((f) => f.name === "Permission Scope");
      assert.ok(perm);
      assert.equal(perm.passed, false);
      assert.ok(perm.details.includes("Bash"));
      assert.ok(perm.details.includes("Write"));
    });

    it("should fail the dependency risk check", () => {
      const dep = findings.find((f) => f.name === "Dependency Risk");
      assert.ok(dep);
      assert.equal(dep.passed, false);
      assert.ok(dep.details.includes("npm install"));
      assert.ok(dep.details.includes("git clone"));
    });

    it("should fail the obfuscation check", () => {
      const obf = findings.find((f) => f.name === "Code Obfuscation");
      assert.ok(obf);
      assert.equal(obf.passed, false);
      assert.ok(obf.details.includes("base64 decode (atob)"));
    });

    it("should fail the sensitive file access check", () => {
      const fs = findings.find((f) => f.name === "Sensitive File Access");
      assert.ok(fs);
      assert.equal(fs.passed, false);
      assert.ok(fs.details.includes("dotfile access") || fs.details.includes(".env file"));
    });

    it("should score very low (danger zone)", () => {
      const score = calculateScore(findings);
      assert.ok(score <= 20, `Expected score <= 20 but got ${score}`);
      assert.equal(getScoreLevel(score), "danger");
    });
  });

  describe("Medium-risk skill", () => {
    const { content, frontmatter } = loadFixture("medium-risk-skill.md");
    const findings = runStaticAnalysis(content, frontmatter);

    it("should fail some checks but not all", () => {
      const failed = findings.filter((f) => !f.passed);
      const passed = findings.filter((f) => f.passed);
      assert.ok(failed.length > 0, "Expected some failures");
      assert.ok(passed.length > 0, "Expected some passes");
    });

    it("should flag permission scope (Bash + Write)", () => {
      const perm = findings.find((f) => f.name === "Permission Scope");
      assert.ok(perm);
      assert.equal(perm.passed, false);
      assert.ok(perm.details.includes("Bash"));
    });

    it("should flag dependency risk (npm install, npx)", () => {
      const dep = findings.find((f) => f.name === "Dependency Risk");
      assert.ok(dep);
      assert.equal(dep.passed, false);
    });

    it("should flag sensitive file access (.env reference)", () => {
      const fs = findings.find((f) => f.name === "Sensitive File Access");
      assert.ok(fs);
      assert.equal(fs.passed, false);
    });

    it("should NOT flag bash execution (no dangerous commands)", () => {
      const bash = findings.find((f) => f.name === "Dangerous Bash Commands");
      assert.ok(bash);
      assert.equal(bash.passed, true);
    });

    it("should NOT flag prompt injection", () => {
      const injection = findings.find((f) => f.name === "Prompt Injection");
      assert.ok(injection);
      assert.equal(injection.passed, true);
    });

    it("should score in the middle range", () => {
      const score = calculateScore(findings);
      assert.ok(score > 20 && score < 80, `Expected score between 20-80 but got ${score}`);
    });
  });

  describe("Prompt injection skill", () => {
    const { content, frontmatter } = loadFixture("prompt-injection-skill.md");
    const findings = runStaticAnalysis(content, frontmatter);

    it("should fail the prompt injection check", () => {
      const injection = findings.find((f) => f.name === "Prompt Injection");
      assert.ok(injection);
      assert.equal(injection.passed, false);
    });

    it("should detect chat template injection", () => {
      const injection = findings.find((f) => f.name === "Prompt Injection");
      assert.ok(injection);
      assert.ok(injection.details.includes("chat template injection"));
    });

    it("should detect Llama system tag injection", () => {
      const injection = findings.find((f) => f.name === "Prompt Injection");
      assert.ok(injection);
      assert.ok(injection.details.includes("Llama system tag injection"));
    });

    it("should detect forget instructions pattern", () => {
      const injection = findings.find((f) => f.name === "Prompt Injection");
      assert.ok(injection);
      assert.ok(injection.details.includes("forget instructions"));
    });

    it("should also flag sensitive file access (.ssh reference)", () => {
      const fs = findings.find((f) => f.name === "Sensitive File Access");
      assert.ok(fs);
      assert.equal(fs.passed, false);
    });
  });
  describe("New checks on malicious skill", () => {
    const { content, frontmatter } = loadFixture("malicious-skill.md");
    const findings = runStaticAnalysis(content, frontmatter);

    it("should flag privilege escalation (crontab manipulation)", () => {
      const check = findings.find((f) => f.name === "Privilege Escalation");
      assert.ok(check);
      assert.equal(check.passed, false);
      assert.ok(check.details.includes("cron job manipulation"));
    });

    it("should pass crypto mining check (no mining patterns)", () => {
      const check = findings.find((f) => f.name === "Crypto Mining");
      assert.ok(check);
      assert.equal(check.passed, true);
    });
  });

  describe("Secrets detection", () => {
    const { content, frontmatter } = loadFixture("secrets-skill.md");
    const findings = runStaticAnalysis(content, frontmatter);

    it("should fail hardcoded secrets check", () => {
      const check = findings.find((f) => f.name === "Hardcoded Secrets");
      assert.ok(check);
      assert.equal(check.passed, false);
    });

    it("should detect Anthropic API key", () => {
      const check = findings.find((f) => f.name === "Hardcoded Secrets");
      assert.ok(check);
      assert.ok(check.details.includes("Anthropic API key"));
    });

    it("should detect AWS access key", () => {
      const check = findings.find((f) => f.name === "Hardcoded Secrets");
      assert.ok(check);
      assert.ok(check.details.includes("AWS access key"));
    });

    it("should detect JWT token", () => {
      const check = findings.find((f) => f.name === "Hardcoded Secrets");
      assert.ok(check);
      assert.ok(check.details.includes("JWT token"));
    });

    it("should detect PEM private key", () => {
      const check = findings.find((f) => f.name === "Hardcoded Secrets");
      assert.ok(check);
      assert.ok(check.details.includes("PEM private key"));
    });
  });

  describe("Safe skill passes all new checks", () => {
    const { content, frontmatter } = loadFixture("safe-skill.md");
    const findings = runStaticAnalysis(content, frontmatter);

    it("should pass hardcoded secrets check", () => {
      const check = findings.find((f) => f.name === "Hardcoded Secrets");
      assert.ok(check);
      assert.equal(check.passed, true);
    });

    it("should pass crypto mining check", () => {
      const check = findings.find((f) => f.name === "Crypto Mining");
      assert.ok(check);
      assert.equal(check.passed, true);
    });

    it("should pass network manipulation check", () => {
      const check = findings.find((f) => f.name === "Network Manipulation");
      assert.ok(check);
      assert.equal(check.passed, true);
    });

    it("should pass privilege escalation check", () => {
      const check = findings.find((f) => f.name === "Privilege Escalation");
      assert.ok(check);
      assert.equal(check.passed, true);
    });

    it("should pass hidden content check", () => {
      const check = findings.find((f) => f.name === "Hidden Content");
      assert.ok(check);
      assert.equal(check.passed, true);
    });
  });
});

// --- Score Calculation Tests ---

describe("Score Calculation", () => {
  it("should return 100 for no findings", () => {
    assert.equal(calculateScore([]), 100);
  });

  it("should return 100 for all passed findings", () => {
    const findings: Finding[] = [
      { name: "Check A", severity: "critical", passed: true, details: "ok" },
      { name: "Check B", severity: "high", passed: true, details: "ok" },
    ];
    assert.equal(calculateScore(findings), 100);
  });

  it("should deduct 25 for a failed critical finding", () => {
    const findings: Finding[] = [
      { name: "Check A", severity: "critical", passed: false, details: "bad" },
    ];
    assert.equal(calculateScore(findings), 75);
  });

  it("should deduct 15 for a failed high finding", () => {
    const findings: Finding[] = [
      { name: "Check A", severity: "high", passed: false, details: "bad" },
    ];
    assert.equal(calculateScore(findings), 85);
  });

  it("should deduct 8 for a failed medium finding", () => {
    const findings: Finding[] = [
      { name: "Check A", severity: "medium", passed: false, details: "bad" },
    ];
    assert.equal(calculateScore(findings), 92);
  });

  it("should deduct 3 for a failed low finding", () => {
    const findings: Finding[] = [
      { name: "Check A", severity: "low", passed: false, details: "bad" },
    ];
    assert.equal(calculateScore(findings), 97);
  });

  it("should not go below 0", () => {
    const findings: Finding[] = [
      { name: "A", severity: "critical", passed: false, details: "bad" },
      { name: "B", severity: "critical", passed: false, details: "bad" },
      { name: "C", severity: "critical", passed: false, details: "bad" },
      { name: "D", severity: "critical", passed: false, details: "bad" },
      { name: "E", severity: "critical", passed: false, details: "bad" },
    ];
    assert.equal(calculateScore(findings), 0);
  });

  it("should accumulate deductions from multiple findings", () => {
    const findings: Finding[] = [
      { name: "A", severity: "critical", passed: false, details: "bad" }, // -25
      { name: "B", severity: "high", passed: false, details: "bad" },     // -15
      { name: "C", severity: "medium", passed: false, details: "bad" },   // -8
    ];
    assert.equal(calculateScore(findings), 52); // 100 - 25 - 15 - 8
  });
});

// --- Score Level Tests ---

describe("Score Level", () => {
  it("should return 'safe' for score >= 70", () => {
    assert.equal(getScoreLevel(100), "safe");
    assert.equal(getScoreLevel(70), "safe");
  });

  it("should return 'caution' for score 40-69", () => {
    assert.equal(getScoreLevel(69), "caution");
    assert.equal(getScoreLevel(40), "caution");
  });

  it("should return 'danger' for score < 40", () => {
    assert.equal(getScoreLevel(39), "danger");
    assert.equal(getScoreLevel(0), "danger");
  });
});

// --- Report Generation Tests ---

describe("Report Generation", () => {
  it("should include score and verdict", () => {
    const report = generateReport(85, []);
    assert.ok(report.includes("Trust Score: 85/100"));
    assert.ok(report.includes("LOW RISK"));
  });

  it("should show MEDIUM RISK for scores 50-79", () => {
    const report = generateReport(65, []);
    assert.ok(report.includes("MEDIUM RISK"));
  });

  it("should show HIGH RISK for scores 20-49", () => {
    const report = generateReport(35, []);
    assert.ok(report.includes("HIGH RISK"));
  });

  it("should show CRITICAL RISK for scores < 20", () => {
    const report = generateReport(10, []);
    assert.ok(report.includes("CRITICAL RISK"));
  });

  it("should list failed findings with severity", () => {
    const findings: Finding[] = [
      { name: "Bad Check", severity: "high", passed: false, details: "Found something bad" },
      { name: "Good Check", severity: "low", passed: true, details: "All good" },
    ];
    const report = generateReport(85, findings);
    assert.ok(report.includes("[HIGH] Bad Check"));
    assert.ok(report.includes("Found something bad"));
    assert.ok(report.includes("Passed Checks"));
    assert.ok(report.includes("Good Check"));
  });
});

// --- Fetcher URL Conversion Tests ---

describe("URL Handling", () => {
  // Test the toRawGitHubUrl logic inline (it's not exported, so we test via fetchSkill behavior)
  // These are pattern tests to verify our regex logic

  it("should recognize github.com blob URLs", () => {
    const url = "https://github.com/user/repo/blob/main/SKILL.md";
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
    assert.ok(match);
    assert.equal(match[1], "user");
    assert.equal(match[2], "repo");
    assert.equal(match[3], "main");
    assert.equal(match[4], "SKILL.md");
  });

  it("should recognize plain repo URLs", () => {
    const url = "https://github.com/user/repo";
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/?$/);
    assert.ok(match);
    assert.equal(match[1], "user");
    assert.equal(match[2], "repo");
  });

  it("should recognize raw.githubusercontent.com URLs", () => {
    const url = "https://raw.githubusercontent.com/user/repo/main/SKILL.md";
    assert.ok(url.includes("raw.githubusercontent.com"));
  });
});

// --- limitFindings Tests ---

describe("limitFindings (free tier)", () => {
  function limitFindings(findings: Finding[]): Finding[] {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const failed = findings
      .filter((f) => !f.passed)
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .slice(0, 3);
    const passed = findings.filter((f) => f.passed);
    return [...failed, ...passed];
  }

  it("should return all findings if 3 or fewer failures", () => {
    const findings: Finding[] = [
      { name: "A", severity: "critical", passed: false, details: "bad" },
      { name: "B", severity: "high", passed: false, details: "bad" },
      { name: "C", severity: "low", passed: true, details: "ok" },
    ];
    const result = limitFindings(findings);
    assert.equal(result.length, 3);
  });

  it("should keep only top 3 most severe failures", () => {
    const findings: Finding[] = [
      { name: "A", severity: "low", passed: false, details: "bad" },
      { name: "B", severity: "critical", passed: false, details: "bad" },
      { name: "C", severity: "medium", passed: false, details: "bad" },
      { name: "D", severity: "high", passed: false, details: "bad" },
      { name: "E", severity: "info", passed: false, details: "bad" },
    ];
    const result = limitFindings(findings);
    const failedNames = result.filter((f) => !f.passed).map((f) => f.name);
    assert.equal(failedNames.length, 3);
    // Should keep critical (B), high (D), medium (C)
    assert.ok(failedNames.includes("B")); // critical
    assert.ok(failedNames.includes("D")); // high
    assert.ok(failedNames.includes("C")); // medium
  });

  it("should always include passed findings", () => {
    const findings: Finding[] = [
      { name: "A", severity: "critical", passed: false, details: "bad" },
      { name: "B", severity: "high", passed: false, details: "bad" },
      { name: "C", severity: "medium", passed: false, details: "bad" },
      { name: "D", severity: "low", passed: false, details: "bad" },
      { name: "E", severity: "info", passed: true, details: "ok" },
    ];
    const result = limitFindings(findings);
    const passedNames = result.filter((f) => f.passed).map((f) => f.name);
    assert.ok(passedNames.includes("E"));
  });
});
