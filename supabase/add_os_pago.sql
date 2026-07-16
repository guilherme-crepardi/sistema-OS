-- Migration: Adicionar campo de pagamento nas OS
-- Execute este SQL no painel do Supabase > SQL Editor

ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE;
