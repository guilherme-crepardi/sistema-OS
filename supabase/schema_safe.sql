-- ============================================
-- MasterTech Eletrônica OS - Schema Seguro (sem erros)
-- Execute este SQL no Supabase > SQL Editor
-- ============================================

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Ordens de Serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL UNIQUE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  problema TEXT,
  valor DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberta'
    CHECK (status IN ('aberta', 'em_andamento', 'aguardando_peca', 'pronta')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clientes IPTV
CREATE TABLE IF NOT EXISTS iptv_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  data_inicio DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  valor DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'vencido', 'cancelado')),
  notificado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_os_cliente ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_iptv_vencimento ON iptv_clientes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_iptv_status ON iptv_clientes(status);
