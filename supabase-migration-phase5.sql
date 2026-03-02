-- Phase 5: Multi-Auditor Marketplace tables
-- Run this in your Supabase SQL editor after the initial migration

-- Auditors table
create table public.auditors (
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

-- Audit assignments table
create table public.audit_assignments (
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

-- Indexes
create index idx_auditors_wallet on public.auditors(wallet_address);
create index idx_auditors_active_rep on public.auditors(active, reputation_score desc);
create index idx_audit_assignments_auditor on public.audit_assignments(auditor_id);
create index idx_audit_assignments_skill on public.audit_assignments(skill_url);

-- RLS
alter table public.auditors enable row level security;
alter table public.audit_assignments enable row level security;

create policy "Auditors are publicly readable"
  on public.auditors for select using (true);

create policy "Service role can manage auditors"
  on public.auditors for all using (true);

create policy "Audit assignments are publicly readable"
  on public.audit_assignments for select using (true);

create policy "Service role can manage assignments"
  on public.audit_assignments for all using (true);
