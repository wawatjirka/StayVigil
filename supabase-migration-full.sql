-- =============================================================
-- Vigil Protocol — Complete Database Schema
-- Run this in your Supabase SQL editor (one-time setup)
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================
-- Phase 1: Core tables
-- =============================================================

-- Skills table (stores scanned skill metadata + results)
create table if not exists public.skills (
  id uuid primary key default uuid_generate_v4(),
  url text not null unique,
  name text not null,
  raw_content text not null default '',
  frontmatter jsonb,
  score integer check (score >= 0 and score <= 100),
  report text,
  scanned_at timestamptz,
  created_at timestamptz default now() not null
);

-- Scan results table (individual check findings)
create table if not exists public.scan_results (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  check_name text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  passed boolean not null,
  details text not null,
  created_at timestamptz default now() not null
);

-- Rate limiting table (IP-based, 10 free scans/day)
create table if not exists public.rate_limits (
  id uuid primary key default uuid_generate_v4(),
  ip_address text not null unique,
  scans_today integer default 0 not null,
  last_reset timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- =============================================================
-- Phase 5: Multi-Auditor Marketplace tables
-- =============================================================

-- Auditors table (registered auditors with stake + reputation)
create table if not exists public.auditors (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text not null unique,
  stake_amount numeric not null default 0,
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  reputation_score integer not null default 50 check (reputation_score >= 0 and reputation_score <= 100),
  total_audits integer not null default 0,
  active boolean not null default true,
  registered_at timestamptz not null default now(),
  created_at timestamptz default now() not null
);

-- Audit assignments table (maps skills to auditors)
create table if not exists public.audit_assignments (
  id uuid primary key default uuid_generate_v4(),
  skill_url text not null,
  auditor_id uuid not null references public.auditors(id),
  status text not null check (status in ('assigned', 'in_progress', 'completed', 'disputed')) default 'assigned',
  score integer check (score >= 0 and score <= 100),
  report text,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

-- =============================================================
-- Indexes
-- =============================================================

create index if not exists idx_skills_url on public.skills(url);
create index if not exists idx_skills_scanned_at on public.skills(scanned_at);
create index if not exists idx_scan_results_skill_id on public.scan_results(skill_id);
create index if not exists idx_rate_limits_ip on public.rate_limits(ip_address);
create index if not exists idx_auditors_wallet on public.auditors(wallet_address);
create index if not exists idx_auditors_active_rep on public.auditors(active, reputation_score desc);
create index if not exists idx_audit_assignments_auditor on public.audit_assignments(auditor_id);
create index if not exists idx_audit_assignments_skill on public.audit_assignments(skill_url);

-- =============================================================
-- Row Level Security
-- =============================================================

alter table public.skills enable row level security;
alter table public.scan_results enable row level security;
alter table public.rate_limits enable row level security;
alter table public.auditors enable row level security;
alter table public.audit_assignments enable row level security;

-- Public read access
create policy "Skills are publicly readable"
  on public.skills for select using (true);

create policy "Scan results are publicly readable"
  on public.scan_results for select using (true);

create policy "Auditors are publicly readable"
  on public.auditors for select using (true);

create policy "Audit assignments are publicly readable"
  on public.audit_assignments for select using (true);

-- Service role write access (API routes use service role key)
create policy "Service role can insert skills"
  on public.skills for insert with check (true);

create policy "Service role can update skills"
  on public.skills for update using (true);

create policy "Service role can delete scan results"
  on public.scan_results for delete using (true);

create policy "Service role can insert scan results"
  on public.scan_results for insert with check (true);

create policy "Service role can manage rate limits"
  on public.rate_limits for all using (true);

create policy "Service role can manage auditors"
  on public.auditors for all using (true);

create policy "Service role can manage assignments"
  on public.audit_assignments for all using (true);
