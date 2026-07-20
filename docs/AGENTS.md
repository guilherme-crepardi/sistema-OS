# AGENTS.md - MasterTech Eletronica OS

## Project Overview

Sistema de gestao para oficina de eletronica. Gerencia clientes, ordens de servico (OS), clientes IPTV com lembretes WhatsApp, e servicos externos. Dashboard financeiro integrado.

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Vercel (auto-deploy via GitHub push)
- **WhatsApp:** Evolution API (configuravel)
- **Node:** v24.18.0

## Repositorio e Deploy

- **GitHub:** `https://github.com/guilherme-crepardi/sistema-OS`
- **Vercel:** `https://sistema-os-theta.vercel.app/`
- **Git user:** Guilherme Crepardi (`guilhermecrepardi28@gmail.com`)
- **Build command:** `& "C:\Program Files\nodejs\npx.cmd" next build`
- **Deploy:** automatico a cada `git push` no branch `main`

## Supabase

- **URL:** `https://nsgevzttitvbsvoygwmh.supabase.co`
- **Anon Key:** configurada em `.env.local`
- **Service Role Key:** configurada em `.env.local` (usada na API de notificacao)
- **Projeto:** `nsgevzttitvbsvoygwmh`

## Architecture

### Estrutura de Pastas

```
src/
  app/
    page.tsx                    # Login/Register
    layout.tsx                  # Root layout (ThemeProvider, font, favicon)
    globals.css                 # Tailwind v4 + dark mode + print styles
    (auth)/
      layout.tsx                # Sidebar + dark mode toggle
      dashboard/page.tsx        # Dashboard com stats + listas por status
      clientes/                 # CRUD de clientes
      os/                       # CRUD de ordens de servico
      iptv/                     # Dashboard IPTV + gestao de clientes
      financeiro/page.tsx       # Dashboard financeiro integrado
      servicos-externos/        # CRUD de servicos externos
    api/
      iptv-notify/route.ts      # API de lembretes WhatsApp (server-side)
  lib/
    supabase.ts                 # Cliente Supabase + tipos + getUserId()
    whatsapp.ts                 # Helpers de mensagens WhatsApp
    theme.tsx                   # ThemeProvider (dark/light + localStorage)
public/
  favicon.svg                   # Logo MTE
supabase/
  schema.sql                    # Schema completo do banco
  add_user_id.sql               # Migration: user_id + RLS
  add_servicos_externos.sql     # Tabela servicos_externos
  add_os_pago.sql               # Coluna pago
  add_iptv_pagou.sql            # Coluna pagou
  add_equipamento.sql           # Coluna equipamento
  add_endereco_fields.sql       # Colunas rua/numero/bairro/cep
```

### Multi-Tenancy (Dados por Usuario)

Cada usuario so ve seus proprios dados. Implementado via:

1. **Coluna `user_id`** em todas as 4 tabelas (clientes, ordens_servico, iptv_clientes, servicos_externos)
2. **RLS (Row Level Security)** habilitado com policies que filtram por `auth.uid() = user_id`
3. **Queries no frontend** filtram por `user_id` via helper `getUserId()` do `src/lib/supabase.ts`
4. **Inserts** incluem `user_id` automaticamente

### Database Tables

| Tabela | Descricao | Colunas-chave |
|---|---|---|
| `clientes` | Clientes da oficina | id, user_id, nome, cpf, rg, telefone, email, endereco (rua/numero/bairro/cep) |
| `ordens_servico` | Ordens de servico | id, user_id, numero (auto-increment), cliente_id (FK), equipamento, descricao, problema, valor, status, pago, observacoes |
| `iptv_clientes` | Clientes IPTV | id, user_id, nome, telefone, email, data_inicio, data_vencimento, valor, status, pagou, notificado |
| `servicos_externos` | Servicos externos/recorrentes | id, user_id, cliente_nome, telefone, servico, tipo, recorrencia, data_servico, valor, pago, observacoes |

### OS Status

- `aberta` - Vermelho
- `em_andamento` - Amarelo
- `aguardando_peca` - Laranja
- `pronta` - Verde
- `entregue` - Azul

### IPTV Status

- `ativo` - Verde
- `vencido` - Vermelho
- `cancelado` - Cinza

### Auth

- Supabase Auth (email + senha)
- Login/Register na pagina `/`
- Session armazenada via Supabase client (cookies)
- User ID obtido via `getUserId()` em `src/lib/supabase.ts`

## Features

### Implementadas

- **Login/Register** com Supabase Auth
- **Sidebar** responsiva com toggle mobile + dark/light mode (persiste no localStorage)
- **Dashboard** com cards de metricas + listas de OS por status (em andamento, prontas, entregues)
- **Clientes CRUD** com busca por nome/CPF, cadastro rapido modal na pagina de OS
- **OS CRUD** com busca por numero/cliente/equipamento, status, equipamento, valor, observacoes
- **OS Detalhe** com editar, excluir, imprimir, toggle pago
- **OS Entregue** status adicionado em todas as telas
- **Impressao com duas vias** - Via da Loja (completa) + Via do Cliente (nome, telefone, endereco) na mesma folha
- **IPTV Dashboard** com seletor de mes, filtros de pagamento (Todos/Pagos/Pendentes), busca, tabela de clientes com confirmar/desfazer pagamento (auto-avanca vencimento pro proximo mes), cards de resumo
- **IPTV Clientes** com monthly reset (pagou=false automatico todo mes), alerta amarelo, filtros por status/pagamento
- **Servicos Externos** CRUD com filtros por tipo/pagamento, periodo (diario/semanal/mensal/anual), seletor de data
- **Financeiro** dashboard integrando OS + IPTV + Servicos Externos com filtros por periodo, origem e status
- **Dark/Light mode** com toggle na sidebar, persiste no localStorage
- **Favicon** SVG com logo MTE
- **ViaCEP** auto-preenchimento de endereco no cadastro de clientes (8 digitos)
- **Lembretes WhatsApp** via Evolution API para clientes IPTV com vencimento em 3 dias
- **Multi-tenancy** - dados por usuario com RLS

### pendente / Melhorias

- Evolution API nao configurada (URL/key vazias no `.env.local`)
- OS numero auto-incremento precisa de sequencia no banco
- Filtro de data por intervalo no financeiro
- Exportacao de dados (PDF/CSV)
- Dashboard mobile otimizado

## Development Commands

```powershell
# Build
& "C:\Program Files\nodejs\npx.cmd" next build

# Dev
& "C:\Program Files\nodejs\npx.cmd" next dev

# Commit e push
git add -A; git commit -m "mensagem"; git push
```

**IMPORTANTE:** Usar `& "C:\Program Files\nodejs\npx.cmd"` em vez de `npm` direto. O PowerShell bloqueia `npm.ps1` por policy de execucao.

## SQL Migrations

Todas as migracoes ficam em `supabase/`. Rodar no Supabase SQL Editor:

1. `schema.sql` - schema completo (setup inicial)
2. `add_equipamento.sql` - coluna equipamento
3. `add_endereco_fields.sql` - colunas rua/numero/bairro/cep
4. `add_iptv_pagou.sql` - coluna pagou
5. `add_os_pago.sql` - coluna pago
6. `add_servicos_externos.sql` - tabela servicos_externos
7. `add_user_id.sql` - user_id + RLS em todas as tabelas

## Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://nsgevzttitvbsvoygwmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=mastertech
```
