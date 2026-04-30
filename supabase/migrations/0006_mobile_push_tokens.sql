create table if not exists public.mobile_push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android', 'web', 'unknown')),
  device_name text,
  app_version text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, expo_push_token)
);

create index if not exists mobile_push_tokens_profile_id_idx
  on public.mobile_push_tokens(profile_id);

create trigger mobile_push_tokens_set_updated_at
before update on public.mobile_push_tokens
for each row execute function public.set_updated_at();

alter table public.mobile_push_tokens enable row level security;

create policy "users manage own mobile push tokens"
on public.mobile_push_tokens for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "operators read mobile push tokens"
on public.mobile_push_tokens for select
using (public.is_operator());
