#!/usr/bin/env node

/**
 * Vigil Protocol MCP Server
 *
 * Provides a `vigil_scan` tool that AI agents (Claude Code, Codex, etc.)
 * can call to verify skills before installing them.
 *
 * Usage: npx ts-node src/mcp/server.ts
 *
 * In Claude Code, add to MCP config:
 * {
 *   "mcpServers": {
 *     "vigil": {
 *       "command": "node",
 *       "args": ["path/to/vigil-protocol/dist/mcp/server.js"]
 *     }
 *   }
 * }
 */

import { stdin, stdout } from "process";

const VIGIL_API_URL = process.env.VIGIL_API_URL || "https://vigil-protocol.vercel.app";

interface MCPRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

const TOOLS = [
  {
    name: "vigil_scan",
    description:
      "Scan an AI agent skill for security vulnerabilities before installing it. Returns a trust score (0-100) and detailed findings about dangerous patterns, prompt injection, data exfiltration, and more. Optionally provide a Solana transaction signature for a paid deep scan (Sonnet).",
    inputSchema: {
      type: "object",
      properties: {
        skillUrl: {
          type: "string",
          description:
            "URL of the skill to scan. Supports GitHub URLs, raw file URLs, and SkillsMP links.",
        },
        txSignature: {
          type: "string",
          description:
            "Solana transaction signature for paid scan. If omitted, uses free tier.",
        },
        paymentType: {
          type: "string",
          enum: ["sol", "vigil"],
          description:
            "Token used for payment: 'sol' or 'vigil'. Required when txSignature is provided.",
        },
      },
      required: ["skillUrl"],
    },
  },
  {
    name: "vigil_score",
    description:
      "Look up the cached trust score for a previously scanned skill. Faster than a full scan.",
    inputSchema: {
      type: "object",
      properties: {
        skillUrl: {
          type: "string",
          description: "URL of the skill to look up.",
        },
      },
      required: ["skillUrl"],
    },
  },
];

async function handleScan(
  skillUrl: string,
  txSignature?: string,
  paymentType?: string
): Promise<{ content: { type: string; text: string }[] }> {
  try {
    let response: Response;

    if (txSignature) {
      // Paid scan — hit /api/v1/scan with payment details
      response = await fetch(`${VIGIL_API_URL}/api/v1/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillUrl, txSignature, paymentType: paymentType || "sol" }),
      });
    } else {
      // Free scan — hit /api/scan
      response = await fetch(`${VIGIL_API_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillUrl }),
      });
    }

    const data = await response.json();

    // Handle 402 Payment Required — return structured payment info
    if (response.status === 402) {
      const p = data.payment;
      const lines = [
        `## Payment Required`,
        ``,
        `A paid scan requires SOL or $VIGIL payment on Solana.`,
        ``,
        `**Treasury wallet:** ${p?.treasury ?? "not configured"}`,
        `**SOL price:** ${p?.priceSol ?? "N/A"} SOL`,
        `**$VIGIL price:** ${p?.priceVigil ?? "N/A"} VIGIL`,
        `**Token mint:** ${p?.mint ?? "not configured"}`,
        `**Network:** ${p?.network ?? "solana"}`,
        ``,
        `Send payment to the treasury wallet, then call vigil_scan again with the txSignature and paymentType.`,
      ];
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }

    // Handle 409 Conflict — duplicate transaction
    if (response.status === 409) {
      return {
        content: [
          { type: "text", text: `Error: Transaction already used. Each scan requires a unique payment transaction.` },
        ],
      };
    }

    if (!response.ok) {
      return {
        content: [
          { type: "text", text: `Error: ${data.error || "Scan failed"}` },
        ],
      };
    }

    const score = data.score as number;
    const safe = data.safe ?? score >= 70;

    const failed = (data.findings || []).filter(
      (f: { passed: boolean }) => !f.passed
    );
    const lines = [
      `## Vigil Security Report`,
      `**Skill:** ${data.skillName}`,
      `**Score:** ${score}/100`,
      `**Verdict:** ${score >= 70 ? "SAFE" : score >= 40 ? "CAUTION" : "DANGER"}`,
      `**Safe to install:** ${safe ? "YES" : "NO"} (threshold: ${data.threshold ?? 70})`,
      ``,
    ];

    if (txSignature) {
      lines.push(`**Tier:** Paid (Sonnet deep review)`);
      lines.push(``);
    }

    if (failed.length > 0) {
      lines.push(`### Issues Found (${failed.length})`);
      for (const f of failed) {
        lines.push(`- **[${f.severity.toUpperCase()}] ${f.name}**: ${f.details}`);
      }
    } else {
      lines.push(`No security issues found.`);
    }

    if (data.note) {
      lines.push(``, `---`, `_${data.note}_`);
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error scanning skill: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
}

async function handleScore(
  skillUrl: string
): Promise<{ content: { type: string; text: string }[] }> {
  try {
    const response = await fetch(
      `${VIGIL_API_URL}/api/score?url=${encodeURIComponent(skillUrl)}`
    );
    const data = await response.json();

    if (!response.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Skill not found in cache. Use vigil_scan to perform a full scan first.`,
          },
        ],
      };
    }

    const score = data.score as number;
    const safe = data.safe ?? score >= 70;

    return {
      content: [
        {
          type: "text",
          text: `**${data.skillName}** — Score: ${score}/100 | **Safe to install:** ${safe ? "YES" : "NO"} (threshold: ${data.threshold ?? 70}) | Scanned ${new Date(data.scannedAt).toLocaleDateString()}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error looking up score: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
}

function handleRequest(req: MCPRequest): MCPResponse | Promise<MCPResponse> {
  switch (req.method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id: req.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "vigil-protocol",
            version: "1.0.0",
          },
        },
      };

    case "notifications/initialized":
      // No response needed for notifications
      return { jsonrpc: "2.0", id: req.id, result: {} };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id: req.id,
        result: { tools: TOOLS },
      };

    case "tools/call": {
      const toolName = (req.params as { name: string })?.name;
      const args = (req.params as { arguments: Record<string, string> })
        ?.arguments;

      if (toolName === "vigil_scan") {
        return handleScan(args.skillUrl, args.txSignature, args.paymentType).then((result) => ({
          jsonrpc: "2.0" as const,
          id: req.id,
          result,
        }));
      }

      if (toolName === "vigil_score") {
        return handleScore(args.skillUrl).then((result) => ({
          jsonrpc: "2.0" as const,
          id: req.id,
          result,
        }));
      }

      return {
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32601, message: `Unknown tool: ${toolName}` },
      };
    }

    default:
      return {
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32601, message: `Unknown method: ${req.method}` },
      };
  }
}

// JSON-RPC over stdio
let buffer = "";

stdin.setEncoding("utf8");
stdin.on("data", async (chunk: string) => {
  buffer += chunk;

  // Process complete messages (newline-delimited JSON)
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const req: MCPRequest = JSON.parse(trimmed);
      const response = await handleRequest(req);
      if (response) {
        stdout.write(JSON.stringify(response) + "\n");
      }
    } catch {
      stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error" },
        }) + "\n"
      );
    }
  }
});

// Signal ready
process.stderr.write("Vigil Protocol MCP server started\n");
