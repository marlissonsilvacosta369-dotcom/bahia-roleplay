-- Bahia Roleplay: tabela para nomes e títulos editáveis pelo painel administrativo.
create table if not exists public.site_content (
 key text primary key,
 value text not null,
 updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
