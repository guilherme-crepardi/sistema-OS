-- Migration: Separar endereco em rua, numero, bairro e cep
-- Execute este SQL no painel do Supabase > SQL Editor

-- Adicionar novos campos
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cep TEXT;

-- Copiar dados do endereco para rua (se existir)
UPDATE clientes SET rua = endereco WHERE endereco IS NOT NULL AND rua IS NULL;

-- Remover coluna endereco (descomente se quiser)
-- ALTER TABLE clientes DROP COLUMN IF EXISTS endereco;
