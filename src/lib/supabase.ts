import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL e ANON_KEY devem estar configuradas no .env.local');
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as any, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
});

export interface Cliente {
  id: string;
  nome: string;
  cpf: string | null;
  rg: string | null;
  telefone: string;
  email: string | null;
  endereco: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrdemServico {
  id: string;
  numero: number;
  cliente_id: string | null;
  equipamento: string | null;
  descricao: string;
  problema: string | null;
  valor: number;
  status: 'aberta' | 'em_andamento' | 'aguardando_peca' | 'pronta';
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
}

export interface IptvCliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  data_inicio: string;
  data_vencimento: string;
  valor: number;
  status: 'ativo' | 'vencido' | 'cancelado';
  pagou: boolean;
  notificado: boolean;
  created_at: string;
  updated_at: string;
}
