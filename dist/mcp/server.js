#!/usr/bin/env node
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const VIGIL_API_URL = process.env.VIGIL_API_URL || "https://vigil-protocol.vercel.app";
const TOOLS = [
    {
        name: "vigil_scan",
        description: "Scan an AI agent skill for security vulnerabilities before installing it. Returns a trust score (0-100) and detailed findings about dangerous patterns, prompt injection, data exfiltration, and more.",
        inputSchema: {
            type: "object",
            properties: {
                skillUrl: {
                    type: "string",
                    description: "URL of the skill to scan. Supports GitHub URLs, raw file URLs, and SkillsMP links.",
                },
            },
            required: ["skillUrl"],
        },
    },
    {
        name: "vigil_score",
        description: "Look up the cached trust score for a previously scanned skill. Faster than a full scan.",
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
async function handleScan(skillUrl) {
    try {
        const response = await fetch(`${VIGIL_API_URL}/api/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skillUrl }),
        });
        const data = await response.json();
        if (!response.ok) {
            return {
                content: [
                    { type: "text", text: `Error: ${data.error || "Scan failed"}` },
                ],
            };
        }
        const failed = (data.findings || []).filter((f) => !f.passed);
        const lines = [
            `## Vigil Security Report`,
            `**Skill:** ${data.skillName}`,
            `**Score:** ${data.score}/100`,
            `**Verdict:** ${data.score >= 70 ? "SAFE" : data.score >= 40 ? "CAUTION" : "DANGER"}`,
            ``,
        ];
        if (failed.length > 0) {
            lines.push(`### Issues Found (${failed.length})`);
            for (const f of failed) {
                lines.push(`- **[${f.severity.toUpperCase()}] ${f.name}**: ${f.details}`);
            }
        }
        else {
            lines.push(`No security issues found.`);
        }
        if (data.note) {
            lines.push(``, `---`, `_${data.note}_`);
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
    catch (error) {
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
async function handleScore(skillUrl) {
    try {
        const response = await fetch(`${VIGIL_API_URL}/api/score?url=${encodeURIComponent(skillUrl)}`);
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
        return {
            content: [
                {
                    type: "text",
                    text: `**${data.skillName}** — Score: ${data.score}/100 (scanned ${new Date(data.scannedAt).toLocaleDateString()})`,
                },
            ],
        };
    }
    catch (error) {
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
function handleRequest(req) {
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
            const toolName = req.params?.name;
            const args = req.params
                ?.arguments;
            if (toolName === "vigil_scan") {
                return handleScan(args.skillUrl).then((result) => ({
                    jsonrpc: "2.0",
                    id: req.id,
                    result,
                }));
            }
            if (toolName === "vigil_score") {
                return handleScore(args.skillUrl).then((result) => ({
                    jsonrpc: "2.0",
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
process_1.stdin.setEncoding("utf8");
process_1.stdin.on("data", async (chunk) => {
    buffer += chunk;
    // Process complete messages (newline-delimited JSON)
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        try {
            const req = JSON.parse(trimmed);
            const response = await handleRequest(req);
            if (response) {
                process_1.stdout.write(JSON.stringify(response) + "\n");
            }
        }
        catch {
            process_1.stdout.write(JSON.stringify({
                jsonrpc: "2.0",
                id: null,
                error: { code: -32700, message: "Parse error" },
            }) + "\n");
        }
    }
});
// Signal ready
process.stderr.write("Vigil Protocol MCP server started\n");
