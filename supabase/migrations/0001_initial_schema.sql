create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'operator', 'owner', 'housekeeping', 'maintenance');
create type public.property_status as enum ('draft', 'active', 'paused', 'archived');
create type public.listing_status as enum ('draft', 'published', 'paused', 'sync_error');
create type public.channel_type as enum ('direct', 'airbnb', 'booking', 'vrbo', 'expedia', 'google_vacation_rentals', 'manual');
create type public.reservation_status as enum ('inquiry', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
create type public.payment_status as enum ('pending', 'authorized', 'paid', 'refunded', 'failed', 'disputed');
create type public.task_status as enum ('open', 'scheduled', 'in_progress', 'blocked', 'done', 'cancelled');
create type public.task_type as enum ('cleaning', 'maintenance', 'inspection', 'guest_request', 'admin');
create type public.incident_status as enum ('open', 'investigating', 'resolved', 'charged', 'cancelled');
create type public.message_channel as enum ('inbox', 'email', 'whatsapp', 'sms', 'airbnb', 'booking', 'vrbo');
create type public.message_direction as enum ('inbound', 'outbound', 'internal');
create type public.conversation_status as enum ('open', 'pending_guest', 'pending_team', 'resolved', 'archived');
create type public.automation_trigger as enum (
  'reservation_confirmed',
  'checkin_24h',
  'checkin_1h',
  'checkout_time',
  'cleaning_completed',
  'message_unanswered',
  'noise_alert',
  'cancellation',
  'low_review'
);
create type public.sync_status as enum ('pending', 'synced', 'failed', 'ignored');
create type public.severity as enum ('low', 'medium', 'high', 'critical');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'operator',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.owner_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  company_name text,
  tax_id text,
  payout_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_account_id uuid references public.owner_accounts(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  internal_name text,
  description text,
  address_line text not null,
  city text not null,
  province text,
  postal_code text,
  country text not null default 'Spain',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  bedrooms int not null default 0 check (bedrooms >= 0),
  bathrooms numeric(4, 1) not null default 0 check (bathrooms >= 0),
  max_guests int not null default 1 check (max_guests > 0),
  base_price numeric(10, 2) not null default 0 check (base_price >= 0),
  cleaning_fee numeric(10, 2) not null default 0 check (cleaning_fee >= 0),
  status public.property_status not null default 'draft',
  checkin_instructions text,
  house_rules text,
  amenities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_listings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  channel public.channel_type not null,
  external_listing_id text,
  public_slug text unique,
  title text not null,
  status public.listing_status not null default 'draft',
  channel_url text,
  sync_enabled boolean not null default false,
  last_synced_at timestamptz,
  sync_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_listing_id)
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  preferred_language text not null default 'es',
  notes text,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete restrict,
  channel public.channel_type not null default 'manual',
  external_reservation_id text,
  status public.reservation_status not null default 'confirmed',
  check_in date not null,
  check_out date not null,
  guests_count int not null default 1 check (guests_count > 0),
  nightly_rate numeric(10, 2) not null default 0 check (nightly_rate >= 0),
  cleaning_fee numeric(10, 2) not null default 0 check (cleaning_fee >= 0),
  taxes_amount numeric(10, 2) not null default 0 check (taxes_amount >= 0),
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  payout_amount numeric(10, 2) not null default 0 check (payout_amount >= 0),
  security_deposit numeric(10, 2) not null default 0 check (security_deposit >= 0),
  currency text not null default 'EUR',
  source_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in),
  unique (channel, external_reservation_id)
);

create table public.calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null default 'Bloqueo manual',
  source public.channel_type not null default 'manual',
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  guest_id uuid references public.guests(id) on delete set null,
  status public.conversation_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_profile_id uuid references public.profiles(id) on delete set null,
  channel public.message_channel not null default 'inbox',
  direction public.message_direction not null default 'internal',
  body text not null,
  external_message_id text,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  type public.task_type not null default 'admin',
  status public.task_status not null default 'open',
  priority public.severity not null default 'medium',
  title text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  reported_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  status public.incident_status not null default 'open',
  severity public.severity not null default 'medium',
  title text not null,
  description text not null,
  estimated_cost numeric(10, 2) check (estimated_cost is null or estimated_cost >= 0),
  charge_amount numeric(10, 2) check (charge_amount is null or charge_amount >= 0),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  status public.payment_status not null default 'pending',
  provider text not null default 'manual',
  provider_payment_id text,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'EUR',
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.owner_statements (
  id uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references public.owner_accounts(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  period_start date not null,
  period_end date not null,
  gross_revenue numeric(10, 2) not null default 0 check (gross_revenue >= 0),
  platform_fees numeric(10, 2) not null default 0 check (platform_fees >= 0),
  cleaning_costs numeric(10, 2) not null default 0 check (cleaning_costs >= 0),
  maintenance_costs numeric(10, 2) not null default 0 check (maintenance_costs >= 0),
  net_payout numeric(10, 2) not null default 0,
  status public.sync_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger public.automation_trigger not null,
  channel public.message_channel not null default 'email',
  template text not null,
  enabled boolean not null default true,
  delay_minutes int not null default 0,
  conditions jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.automation_rules(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  guest_id uuid references public.guests(id) on delete set null,
  status public.sync_status not null default 'pending',
  error_message text,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.channel_sync_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  listing_id uuid references public.property_listings(id) on delete cascade,
  channel public.channel_type not null,
  status public.sync_status not null default 'pending',
  direction text not null check (direction in ('inbound', 'outbound')),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  property_id uuid references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete cascade,
  incident_id uuid references public.incidents(id) on delete cascade,
  storage_path text not null,
  title text not null,
  mime_type text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'system',
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index owner_accounts_profile_id_idx on public.owner_accounts(profile_id);
create index properties_owner_account_id_idx on public.properties(owner_account_id);
create index properties_city_idx on public.properties(city);
create index properties_status_idx on public.properties(status);
create index property_listings_property_id_idx on public.property_listings(property_id);
create index property_listings_channel_idx on public.property_listings(channel);
create index guests_email_idx on public.guests(email);
create index guests_phone_idx on public.guests(phone);
create index reservations_property_id_idx on public.reservations(property_id);
create index reservations_guest_id_idx on public.reservations(guest_id);
create index reservations_check_in_idx on public.reservations(check_in);
create index reservations_status_idx on public.reservations(status);
create index calendar_blocks_property_dates_idx on public.calendar_blocks(property_id, start_date, end_date);
create index conversations_property_id_idx on public.conversations(property_id);
create index conversations_reservation_id_idx on public.conversations(reservation_id);
create index conversation_messages_conversation_sent_idx on public.conversation_messages(conversation_id, sent_at);
create index tasks_property_id_idx on public.tasks(property_id);
create index tasks_assigned_to_idx on public.tasks(assigned_to);
create index tasks_due_at_idx on public.tasks(due_at);
create index tasks_status_idx on public.tasks(status);
create index incidents_property_id_idx on public.incidents(property_id);
create index incidents_status_idx on public.incidents(status);
create index payments_reservation_id_idx on public.payments(reservation_id);
create index owner_statements_owner_account_id_idx on public.owner_statements(owner_account_id);
create index automation_runs_rule_id_idx on public.automation_runs(rule_id);
create index channel_sync_events_listing_id_idx on public.channel_sync_events(listing_id);
create index documents_property_id_idx on public.documents(property_id);
create index notifications_user_read_idx on public.notifications(user_id, read_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger owner_accounts_set_updated_at before update on public.owner_accounts for each row execute function public.set_updated_at();
create trigger properties_set_updated_at before update on public.properties for each row execute function public.set_updated_at();
create trigger property_listings_set_updated_at before update on public.property_listings for each row execute function public.set_updated_at();
create trigger guests_set_updated_at before update on public.guests for each row execute function public.set_updated_at();
create trigger reservations_set_updated_at before update on public.reservations for each row execute function public.set_updated_at();
create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger incidents_set_updated_at before update on public.incidents for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger owner_statements_set_updated_at before update on public.owner_statements for each row execute function public.set_updated_at();
create trigger automation_rules_set_updated_at before update on public.automation_rules for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'operator');

  insert into public.profiles (id, full_name, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    case
      when requested_role in ('admin', 'operator', 'owner', 'housekeeping', 'maintenance') then requested_role::public.user_role
      else 'operator'::public.user_role
    end,
    new.raw_user_meta_data ->> 'avatar_url'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
