-- Migration: Criar tabela de serviços externos
-- Execute este SQL no painel do Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS servicos_externos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  telefone TEXT,
  servico TEXT NOT NULL,
  valor DECIMAL(10,2) DEFAULT 0,
  pago BOOLEAN DEFAULT FALSE,
  tipo TEXT NOT NULL DEFAULT 'externo'
    CHECK (tipo IN ('externo', 'recorrente')),
  recorrencia TEXT
    CHECK (recorrencia IS NULL OR recorrencia IN ('semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual')),
  data_servico DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE servicos_externos ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Permitir acesso completo para anônimos" ON servicos_externos FOR ALL USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_servicos_externos_tipo ON servicos_externos(tipo);
CREATE INDEX IF NOT EXISTS idx_servicos_externos_pago ON servicos_externos(pago);
