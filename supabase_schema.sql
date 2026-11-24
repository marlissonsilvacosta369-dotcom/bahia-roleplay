-- Execute no SQL Editor do projeto Supabase.
create table if not exists public.portal_requests (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null,
  discord_username text not null,
  type text not null check (type in ('id','denuncia','revisao')),
  status text not null default 'Recebido',
  player_id integer,
  first_name text,
  last_name text,
  rp_name text,
  description text,
  identificacao text,
  target text,
  event_date text,
  punishment_type text,
  proof_url text,
  staff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portal_requests_type_status_idx on public.portal_requests(type,status);
create index if not exists portal_requests_discord_idx on public.portal_requests(discord_id,created_at desc);
-- Não habilite acesso direto do navegador: functions usam Service Role no servidor.
alter table public.portal_requests enable row level security;

-- Evita múltiplos registros de liberação para o mesmo ID de jogador.
create unique index if not exists portal_unique_requested_player_id on public.portal_requests(player_id) where type='id' and player_id is not null;

-- Cadastro de nome RP associado à conta Discord. Executar também para a versão com perfil obrigatório.
create table if not exists public.portal_profiles (
 discord_id text primary key,
 discord_username text not null,
 first_name text not null,
 last_name text not null,
 rp_name text not null,
 rp_name_lower text not null unique,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.portal_profiles enable row level security;
