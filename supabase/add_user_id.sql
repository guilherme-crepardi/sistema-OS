-- ============================================================
-- MIGRAÇÃO: Adicionar user_id a todas as tabelas
-- Cada usuário só verá seus próprios dados
-- Execute no Supabase SQL Editor → "Run without RLS"
-- ============================================================

-- 1. Adicionar coluna user_id em clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);

-- 2. Adicionar coluna user_id em ordens_servico
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ordens_servico_user_id ON ordens_servico(user_id);

-- 3. Adicionar coluna user_id em iptv_clientes
ALTER TABLE iptv_clientes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_iptv_clientes_user_id ON iptv_clientes(user_id);

-- 4. Adicionar coluna user_id em servicos_externos
ALTER TABLE servicos_externos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_servicos_externos_user_id ON servicos_externos(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Proteção no banco de dados
-- Execute segunda query no SQL Editor → "Run" (com RLS habilitado)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE iptv_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_externos ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
CREATE POLICY "Usuarios veem apenas seus clientes" ON clientes
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para ordens_servico
CREATE POLICY "Usuarios veem apenas suas OS" ON ordens_servico
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para iptv_clientes
CREATE POLICY "Usuarios veem apenas seus clientes IPTV" ON iptv_clientes
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para servicos_externos
CREATE POLICY "Usuarios veem apenas seus servicos externos" ON servicos_externos
  FOR ALL USING (auth.uid() = user_id);
