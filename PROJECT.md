# Vigil Protocol

Decentralized AI skill verification network. Scans agent skills for vulnerabilities before installation.

## Stack

- **App**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **DB**: Supabase (Postgres + RLS)
- **Payments**: SOL on Solana + ETH on Base L2 (dual-chain, feature-flagged via `NEXT_PUBLIC_BASE_ENABLED`)
- **Identity**: ERC-8004 agent registry on Solana via `8004-solana` SDK
- **AI**: Groq (free tier, Llama 3.3 70B) + Anthropic (paid tier, Claude Sonnet)
- **Programs**: Anchor (Rust) in `programs/` — VigilStaking, VigilChallenge, BountyVault

## Commands

```bash
npm run dev          # Start dev server (turbopack)
npm run build        # Production build — ALWAYS run after changes to verify
npm run lint         # ESLint (flat config)
npm test             # Scanner unit tests (59 tests)
cd programs && anchor build   # Compile Anchor programs
cd programs && anchor test    # Run program tests (6 tests)
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages + API routes
    api/scan/             # Free scan endpoint (rate-limited, top 3 findings)
    api/v1/scan/          # Paid scan endpoint (SOL payment, full report)
    api/score/            # Cached score lookup
    api/badge/            # Trust badge for SkillsMP integration
    api/reputation/       # 8004-solana on-chain reputation
    api/auditor/          # Auditor registration + dashboard
    api/audit/assign/     # Multi-auditor assignment
    auditor/              # Auditor portal page
  lib/
    scanner/              # Core: static-analysis.ts, llm-review.ts, score.ts
    agent/                # 8004-solana identity + reputation (Solana)
    marketplace/          # Multi-auditor assignment + consensus
    idl/                  # Anchor IDL JSON files for program clients
    supabase.ts           # DB client (no generic types — use `any` casts)
    fetcher.ts            # Fetch + parse SKILL.md from GitHub URLs
    rate-limit.ts         # IP-based rate limiting via Supabase
    chain/                # Chain abstraction layer (dual-chain support)
      types.ts            # ChainAdapter interface, ChainId, PaymentInfo
      index.ts            # Adapter registry + BASE_ENABLED flag
      solana-adapter.ts   # Wraps existing Solana code
      base-adapter.ts     # viem implementation for Base L2
      context.tsx          # React chain selection context + useChain hook
    solana.ts             # Solana connection + config singleton
    solana-verify.ts      # On-chain verification (signatures, balances, payments)
    solana-programs.ts    # Anchor program client (staking, challenge, bounty reads)
  components/             # React components (Header, Footer, ScanForm, ScoreBadge, FindingCard, ChainSelector, BaseProvider)
  mcp/server.ts           # MCP server for Claude Code integration
programs/
  programs/
    vigil-staking/        # Auditor staking + tier thresholds + slashing
    vigil-challenge/      # Dispute resolution for auditor reports
    bounty-vault/         # Reward distribution for successful challenges
  tests/                  # Anchor tests (6 tests)
contracts-archive/        # Archived Solidity contracts (Base deployment history)
```

## Code Conventions

- TypeScript strict mode. Fix type errors, don't suppress with `@ts-ignore`.
- Use `as any` only at SDK adapter boundaries (e.g., Anchor IDL ↔ TypeScript).
- API routes: validate input, return proper HTTP status codes, wrap in try/catch.
- Supabase client uses untyped `createClient()` (no generic param) — the Database type interface is for reference only.
- Components are client components (`"use client"`) only when they use hooks/state.
- Tailwind: dark mode via `dark:` prefix. Zinc palette for neutrals, blue for primary.

## Security Rules (This is a security product — lead by example)

- Never log or store raw private keys, API keys, or secrets.
- All env vars in `.env.local` (gitignored). Reference `.env.local.example` for shape.
- Validate all user-supplied URLs before fetching (must parse with `new URL()`).
- Static analysis engine has 12 checks in `scanner/static-analysis.ts` — add new checks as `CheckFn` functions appended to `ALL_CHECKS`.
- LLM review prompt in `scanner/llm-review.ts` — keep the SYSTEM_PROMPT security-focused.

## Gotchas

- Solana wallet addresses are base58 case-sensitive — never `.toLowerCase()` them.
- `@solana/web3.js` v1.x is required (not v2) — wallet adapter ecosystem depends on it.
- `8004-solana` SDK uses `@solana/web3.js` v1.x — compatible with wallet adapter.
- `VIGIL_TOKEN_MINT` not set = demo mode (token balance returns null, default bronze tier).
- `VIGIL_STAKING_PROGRAM_ID` not set = staking not deployed (falls back to token balance for tier).
- `8004-solana` uses base58 asset pubkeys for agent identity, not numeric IDs.
- `NEXT_PUBLIC_BASE_ENABLED` not set = Base hidden. Set to `"true"` to activate dual-chain UI + API.
- Paid scan API (`/api/v1/scan`) accepts optional `chain` param: `"solana"` (default) or `"base"`.
- Auditor registration accepts optional `chain` param. Auditor uniqueness is per (wallet_address, chain).
- MCP `vigil_scan` tool accepts optional `chain` param for Base payments.
- `gray-matter` parses YAML frontmatter — import as default: `import matter from "gray-matter"`.
- Anchor programs dir has its own `package.json` and `Cargo.toml`. Run anchor commands from `programs/`.
- Anchor programs require Rust toolchain: `rustup`, `solana-cli`, `anchor-cli`.
- SPL token uses 6 decimals (pump.fun standard). All on-chain thresholds use base units.
- Use `supabase-migration-full.sql` for fresh Supabase setup (combines all phases). Must be run manually in the Supabase SQL editor.
- `programs/` and `contracts-archive/` are excluded from root tsconfig and eslint config.
