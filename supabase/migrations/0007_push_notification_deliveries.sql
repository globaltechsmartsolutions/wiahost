create table if not exists public.push_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete set null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token_id uuid references public.mobile_push_tokens(id) on delete set null,
  expo_push_token text not null,
  expo_ticket_id text,
  status text not null default 'queued' check (status in ('queued', 'ok', 'error', 'skipped')),
  error_code text,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_notification_deliveries_profile_id_idx
  on public.push_notification_deliveries(profile_id);

create index if not exists push_notification_deliveries_notification_id_idx
  on public.push_notification_deliveries(notification_id);

create index if not exists push_notification_deliveries_status_idx
  on public.push_notification_deliveries(status);

create trigger push_notification_deliveries_set_updated_at
before update on public.push_notification_deliveries
for each row execute function public.set_updated_at();

alter table public.push_notification_deliveries enable row level security;

create policy "operators manage push deliveries"
on public.push_notification_deliveries for all
using (public.is_operator())
with check (public.is_operator());

create policy "users read own push deliveries"
on public.push_notification_deliveries for select
using (profile_id = auth.uid());
