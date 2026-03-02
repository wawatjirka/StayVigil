-- Vigil Protocol Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Skills table
create table public.skills (
  id uuid primary key default uuid_generate_v4(),
  url text not null unique,
  name text not null,
  raw_content text not null,
  frontmatter jsonb,
  score integer check (score >= 0 and score <= 100),
  report text,
  scanned_at timestamptz,
  created_at timestamptz default now() not null
);

-- Scan results table
create table public.scan_results (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  check_name text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  passed boolean not null,
  details text not null,
  created_at timestamptz default now() not null
);

-- Rate limiting table
create table public.rate_limits (
  id uuid primary key default uuid_generate_v4(),
  ip_address text not null,
  scans_today integer default 0 not null,
  last_reset timestamptz default now() not null,
  created_at timestamptz default now() not null,
  unique(ip_address)
);

-- Indexes
create index idx_skills_url on public.skills(url);
create index idx_skills_scanned_at on public.skills(scanned_at);
create index idx_scan_results_skill_id on public.scan_results(skill_id);
create index idx_rate_limits_ip on public.rate_limits(ip_address);

-- Row Level Security
alter table public.skills enable row level security;
alter table public.scan_results enable row level security;
alter table public.rate_limits enable row level security;

-- Public read access for skills and scan results
create policy "Skills are publicly readable"
  on public.skills for select
  using (true);

create policy "Scan results are publicly readable"
  on public.scan_results for select
  using (true);

-- Only service role can insert/update
create policy "Service role can insert skills"
  on public.skills for insert
  with check (true);

create policy "Service role can update skills"
  on public.skills for update
  using (true);

create policy "Service role can insert scan results"
  on public.scan_results for insert
  with check (true);

create policy "Service role can manage rate limits"
  on public.rate_limits for all
  using (true);
