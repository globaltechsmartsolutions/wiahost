create table public.channel_accounts (
  id uuid primary key default gen_random_uuid(),
  channel public.channel_type not null,
  account_label text not null,
  external_account_id text,
  auth_mode text not null default 'manual' check (auth_mode in ('manual', 'oauth', 'api_key', 'partner_api', 'ical_only')),
  status text not null default 'planned' check (status in ('planned', 'pending_credentials', 'connected', 'needs_attention', 'disabled')),
  health_status public.sync_status not null default 'pending',
  scopes jsonb not null default '[]'::jsonb,
  notes text,
  connected_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_account_id)
);

create index channel_accounts_channel_idx on public.channel_accounts(channel);
create index channel_accounts_status_idx on public.channel_accounts(status);
create index channel_accounts_health_status_idx on public.channel_accounts(health_status);

alter table public.channel_accounts enable row level security;

create policy "operators manage channel accounts" on public.channel_accounts
for all using (public.is_operator()) with check (public.is_operator());

create trigger channel_accounts_set_updated_at
before update on public.channel_accounts
for each row execute function public.set_updated_at();
