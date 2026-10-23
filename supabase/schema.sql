-- Tabela onde ficam os pedidos dos formulários do site.
-- Cole este arquivo no Supabase em SQL Editor > New query e clique em Run.

create table if not exists public.leads (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  tipo text not null check (tipo in ('projeto', 'parceiro')),
  nome text not null,
  email text,
  telefone text not null,
  dados jsonb not null default '{}'::jsonb,
  status text not null default 'novo'
);

create index if not exists leads_criado_em_idx on public.leads (criado_em desc);

-- Ninguém de fora lê ou escreve na tabela. Só o site (com a chave secreta) grava.
alter table public.leads enable row level security;
