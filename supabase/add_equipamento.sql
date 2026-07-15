-- Adicionar coluna equipamento na tabela ordens_servico
-- Execute este SQL no Supabase > SQL Editor

ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS equipamento TEXT;

-- Adicionar índice para busca por equipamento
CREATE INDEX IF NOT EXISTS idx_os_equipamento ON ordens_servico(equipamento);
