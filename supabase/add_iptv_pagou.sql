-- Migration: Adicionar campo de pagamento IPTV
-- Execute este SQL no painel do Supabase > SQL Editor

-- Adicionar campo pagou
ALTER TABLE iptv_clientes ADD COLUMN IF NOT EXISTS pagou BOOLEAN DEFAULT FALSE;
