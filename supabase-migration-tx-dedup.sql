-- =============================================================
-- Vigil Protocol — Transaction Deduplication
-- Prevents replay of a single txSignature for unlimited paid scans.
-- Run this in your Supabase SQL editor after the core schema.
-- =============================================================

-- Used transaction signatures (prevents replay attacks)
create table if not exists public.used_tx_signatures (
  id uuid primary key default uuid_generate_v4(),
  tx_signature text not null unique,
  payment_type text not null check (payment_type in ('sol', 'vigil')),
  skill_url text not null,
  created_at timestamptz default now() not null
);

-- Index for fast lookup by signature
create index if not exists idx_used_tx_signatures_sig
  on public.used_tx_signatures(tx_signature);

-- Row Level Security
alter table public.used_tx_signatures enable row level security;

-- Public read access
create policy "Used tx signatures are publicly readable"
  on public.used_tx_signatures for select using (true);

-- Service role write access (API routes use service role key)
create policy "Service role can insert used tx signatures"
  on public.used_tx_signatures for insert with check (true);
