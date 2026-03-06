# StayVigil

Trust, but verify. Scan AI agent skills for security vulnerabilities before installing them.

**https://vigil-protocol.vercel.app**

## What it does

StayVigil scans AI agent skills (SKILL.md files, MCP tools, etc.) for:

- Prompt injection and hidden instructions
- Data exfiltration patterns
- Dangerous shell commands
- Dependency risks
- Obfuscated code
- And more (12+ static checks + LLM deep review)

Returns a trust score (0-100) and detailed findings.

## API

```bash
# Free scan (rate limited, top 3 findings)
curl -X POST https://vigil-protocol.vercel.app/api/scan \
  -H "Content-Type: application/json" \
  -d '{"skillUrl": "https://github.com/user/repo/blob/main/SKILL.md"}'

# Score lookup (cached, instant)
curl "https://vigil-protocol.vercel.app/api/score?url=https://github.com/user/repo/blob/main/SKILL.md"
```

## MCP Integration

Use StayVigil directly in Claude Code:

```json
{
  "mcpServers": {
    "vigil": {
      "command": "node",
      "args": ["path/to/stayvigil/dist/mcp/server.js"]
    }
  }
}
```

## Stack

- Next.js 16 + TypeScript + Tailwind CSS 4
- Supabase (Postgres)
- Solana + Base L2 (dual-chain payments)
- Groq (free tier) + Anthropic (paid tier)
- Anchor programs (staking, challenges, bounties)

## License

MIT
