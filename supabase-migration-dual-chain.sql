-- Dual-chain support: Solana + Base
-- Run in Supabase SQL editor after deploying dual-chain code.

-- Add chain column to auditors
ALTER TABLE public.auditors ADD COLUMN IF NOT EXISTS chain text NOT NULL DEFAULT 'solana'
  CHECK (chain IN ('solana', 'base'));

-- Add chain column to used_tx_signatures
ALTER TABLE public.used_tx_signatures ADD COLUMN IF NOT EXISTS chain text NOT NULL DEFAULT 'solana'
  CHECK (chain IN ('solana', 'base'));

-- Replace wallet_address unique constraint with (wallet_address, chain) pair
ALTER TABLE public.auditors DROP CONSTRAINT IF EXISTS auditors_wallet_address_key;
ALTER TABLE public.auditors ADD CONSTRAINT auditors_wallet_chain_unique UNIQUE (wallet_address, chain);
