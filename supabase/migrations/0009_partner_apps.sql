create table public.partner_apps (
  id uuid primary key default gen_random_uuid(),
  partner_id text not null unique,
  display_name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'revoked')),
  key_hash text,
  key_prefix text,
  allowed_origins jsonb not null default '[]'::jsonb,
  redirect_urls jsonb not null default '[]'::jsonb,
  webhook_url text,
  scopes jsonb not null default '["listings","availability","inquiries","reservations:read"]'::jsonb,
  rate_limit_per_minute int not null default 60 check (rate_limit_per_minute > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (partner_id = lower(partner_id)),
  check (partner_id ~ '^[a-z0-9][a-z0-9_.-]{1,80}$'),
  check (status <> 'active' or key_hash is not null)
);

create index partner_apps_status_idx on public.partner_apps(status);
create index partner_apps_key_hash_idx on public.partner_apps(key_hash);
create index partner_apps_key_prefix_idx on public.partner_apps(key_prefix);

alter table public.partner_apps enable row level security;

create policy "operators manage partner apps" on public.partner_apps
for all using (public.is_operator()) with check (public.is_operator());

create trigger partner_apps_set_updated_at
before update on public.partner_apps
for each row execute function public.set_updated_at();
