create type public.ai_actor_type as enum ('user', 'system', 'automation', 'model');
create type public.ai_label_source as enum ('human', 'rule', 'model', 'import');
create type public.ai_model_task as enum (
  'message_priority',
  'message_summary',
  'task_priority',
  'incident_risk',
  'pricing_recommendation',
  'occupancy_forecast',
  'anomaly_detection',
  'visual_audit',
  'functional_audit',
  'document_extraction',
  'other'
);
create type public.ai_prediction_status as enum ('draft', 'suggested', 'accepted', 'rejected', 'expired', 'superseded');
create type public.ai_feedback_value as enum ('accepted', 'edited', 'rejected', 'ignored', 'resolved', 'failed');
create type public.quality_audit_area as enum ('visual', 'functional', 'accessibility', 'performance', 'security', 'copy', 'other');
create type public.quality_audit_status as enum ('open', 'accepted', 'resolved', 'ignored');

create table public.operational_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid default auth.uid() references public.profiles(id) on delete set null,
  actor_type public.ai_actor_type not null default 'user',
  event_name text not null check (length(trim(event_name)) >= 3),
  entity_type text not null check (length(trim(entity_type)) >= 2),
  entity_id uuid,
  property_id uuid references public.properties(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  incident_id uuid references public.incidents(id) on delete set null,
  source text not null default 'app',
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.message_labels (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid references public.conversation_messages(id) on delete cascade,
  labeled_by uuid references public.profiles(id) on delete set null,
  source public.ai_label_source not null default 'human',
  category text,
  urgency public.severity,
  sentiment text check (sentiment is null or sentiment in ('positive', 'neutral', 'negative', 'mixed', 'unknown')),
  intent text,
  language text,
  confidence numeric(4, 3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  rationale text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    category is not null
    or urgency is not null
    or sentiment is not null
    or intent is not null
    or language is not null
  )
);

create table public.task_outcomes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null unique references public.tasks(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  status public.task_status not null,
  priority public.severity,
  sla_due_at timestamptz,
  completed_at timestamptz,
  sla_minutes_delta int,
  outcome text not null default 'pending' check (outcome in ('pending', 'completed_on_time', 'completed_late', 'cancelled', 'blocked', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservation_snapshots (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  snapshot_date date not null default current_date,
  status public.reservation_status not null,
  channel public.channel_type not null,
  check_in date not null,
  check_out date not null,
  lead_time_days int,
  nights_count int check (nights_count is null or nights_count > 0),
  nightly_rate numeric(10, 2) check (nightly_rate is null or nightly_rate >= 0),
  total_amount numeric(10, 2) check (total_amount is null or total_amount >= 0),
  payout_amount numeric(10, 2) check (payout_amount is null or payout_amount >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (reservation_id, snapshot_date)
);

create table public.pricing_observations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  observed_for date not null,
  source text not null default 'manual',
  current_price numeric(10, 2) check (current_price is null or current_price >= 0),
  suggested_price numeric(10, 2) check (suggested_price is null or suggested_price >= 0),
  approved_price numeric(10, 2) check (approved_price is null or approved_price >= 0),
  final_price numeric(10, 2) check (final_price is null or final_price >= 0),
  currency text not null default 'EUR',
  occupancy_rate numeric(5, 4) check (occupancy_rate is null or (occupancy_rate >= 0 and occupancy_rate <= 1)),
  booking_pace numeric(10, 2),
  lead_time_days int,
  conversion_status text check (conversion_status is null or conversion_status in ('unknown', 'viewed', 'inquiry', 'booked', 'lost', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.incident_features (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null unique references public.incidents(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  category text,
  severity_initial public.severity,
  severity_final public.severity,
  recurrence_count int not null default 0 check (recurrence_count >= 0),
  estimated_cost numeric(10, 2) check (estimated_cost is null or estimated_cost >= 0),
  actual_cost numeric(10, 2) check (actual_cost is null or actual_cost >= 0),
  resolution_minutes int check (resolution_minutes is null or resolution_minutes >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.model_predictions (
  id uuid primary key default gen_random_uuid(),
  task public.ai_model_task not null,
  model_name text not null,
  model_version text not null,
  entity_type text not null,
  entity_id uuid,
  property_id uuid references public.properties(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  incident_id uuid references public.incidents(id) on delete set null,
  input_hash text not null,
  input_summary jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  explanation jsonb not null default '{}'::jsonb,
  confidence numeric(4, 3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status public.ai_prediction_status not null default 'suggested',
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  feedback public.ai_feedback_value,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid references public.model_predictions(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  provider text,
  model_name text,
  prompt_hash text,
  prompt_summary jsonb not null default '{}'::jsonb,
  response_summary jsonb not null default '{}'::jsonb,
  risk_level public.severity not null default 'low',
  contains_personal_data boolean not null default false,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.quality_audit_memories (
  id uuid primary key default gen_random_uuid(),
  area public.quality_audit_area not null,
  route text,
  component text,
  finding_hash text not null unique,
  title text not null,
  description text not null,
  severity public.severity not null default 'medium',
  status public.quality_audit_status not null default 'open',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index operational_events_actor_idx on public.operational_events(actor_profile_id, occurred_at);
create index operational_events_entity_idx on public.operational_events(entity_type, entity_id);
create index operational_events_property_idx on public.operational_events(property_id, occurred_at);
create index operational_events_event_name_idx on public.operational_events(event_name, occurred_at);
create index message_labels_conversation_idx on public.message_labels(conversation_id, created_at);
create index message_labels_message_idx on public.message_labels(message_id);
create index task_outcomes_property_idx on public.task_outcomes(property_id, status);
create index reservation_snapshots_property_date_idx on public.reservation_snapshots(property_id, snapshot_date);
create index pricing_observations_property_date_idx on public.pricing_observations(property_id, observed_for);
create index incident_features_property_idx on public.incident_features(property_id, category);
create index model_predictions_task_status_idx on public.model_predictions(task, status);
create index model_predictions_entity_idx on public.model_predictions(entity_type, entity_id);
create index model_predictions_property_idx on public.model_predictions(property_id, created_at);
create index ai_audit_log_prediction_idx on public.ai_audit_log(prediction_id);
create index ai_audit_log_actor_idx on public.ai_audit_log(actor_profile_id, created_at);
create index quality_audit_memories_area_status_idx on public.quality_audit_memories(area, status);

create trigger message_labels_set_updated_at before update on public.message_labels for each row execute function public.set_updated_at();
create trigger task_outcomes_set_updated_at before update on public.task_outcomes for each row execute function public.set_updated_at();
create trigger incident_features_set_updated_at before update on public.incident_features for each row execute function public.set_updated_at();
create trigger model_predictions_set_updated_at before update on public.model_predictions for each row execute function public.set_updated_at();
create trigger quality_audit_memories_set_updated_at before update on public.quality_audit_memories for each row execute function public.set_updated_at();

alter table public.operational_events enable row level security;
alter table public.message_labels enable row level security;
alter table public.task_outcomes enable row level security;
alter table public.reservation_snapshots enable row level security;
alter table public.pricing_observations enable row level security;
alter table public.incident_features enable row level security;
alter table public.model_predictions enable row level security;
alter table public.ai_audit_log enable row level security;
alter table public.quality_audit_memories enable row level security;

create policy "operators manage operational events" on public.operational_events
  for all using (public.is_operator()) with check (public.is_operator());
create policy "users read related operational events" on public.operational_events
  for select using (
    actor_profile_id = auth.uid()
    or (property_id is not null and public.can_manage_property(property_id))
  );
create policy "users insert own operational events" on public.operational_events
  for insert with check (auth.uid() is not null and actor_profile_id = auth.uid());

create policy "operators manage message labels" on public.message_labels
  for all using (public.is_operator()) with check (public.is_operator());
create policy "related users read message labels" on public.message_labels
  for select using (public.can_view_conversation(conversation_id));

create policy "operators manage task outcomes" on public.task_outcomes
  for all using (public.is_operator()) with check (public.is_operator());
create policy "related users read task outcomes" on public.task_outcomes
  for select using (
    public.can_manage_property(property_id)
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.assigned_to = auth.uid()
    )
  );

create policy "operators manage reservation snapshots" on public.reservation_snapshots
  for all using (public.is_operator()) with check (public.is_operator());
create policy "related users read reservation snapshots" on public.reservation_snapshots
  for select using (public.can_manage_property(property_id));

create policy "operators manage pricing observations" on public.pricing_observations
  for all using (public.is_operator()) with check (public.is_operator());
create policy "related users read pricing observations" on public.pricing_observations
  for select using (public.can_manage_property(property_id));

create policy "operators manage incident features" on public.incident_features
  for all using (public.is_operator()) with check (public.is_operator());
create policy "related users read incident features" on public.incident_features
  for select using (public.can_manage_property(property_id));

create policy "operators manage model predictions" on public.model_predictions
  for all using (public.is_operator()) with check (public.is_operator());
create policy "related users read model predictions" on public.model_predictions
  for select using (
    created_by = auth.uid()
    or reviewed_by = auth.uid()
    or (property_id is not null and public.can_manage_property(property_id))
    or (reservation_id is not null and public.can_view_reservation(reservation_id))
    or (conversation_id is not null and public.can_view_conversation(conversation_id))
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.assigned_to = auth.uid()
    )
  );

create policy "operators manage ai audit log" on public.ai_audit_log
  for all using (public.is_operator()) with check (public.is_operator());
create policy "users read own ai audit log" on public.ai_audit_log
  for select using (actor_profile_id = auth.uid() or approved_by = auth.uid());

create policy "operators manage quality audit memories" on public.quality_audit_memories
  for all using (public.is_operator()) with check (public.is_operator());
