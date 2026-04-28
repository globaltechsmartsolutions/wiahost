create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'operator'), false);
$$;

create or replace function public.can_manage_property(property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operator()
    or exists (
      select 1
      from public.properties p
      join public.owner_accounts oa on oa.id = p.owner_account_id
      where p.id = property_id
        and oa.profile_id = auth.uid()
    );
$$;

create or replace function public.can_view_reservation(reservation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operator()
    or exists (
      select 1
      from public.reservations r
      where r.id = reservation_id
        and public.can_manage_property(r.property_id)
    );
$$;

create or replace function public.can_view_conversation(conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operator()
    or exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and public.can_manage_property(c.property_id)
    );
$$;

alter table public.profiles enable row level security;
alter table public.owner_accounts enable row level security;
alter table public.properties enable row level security;
alter table public.property_listings enable row level security;
alter table public.guests enable row level security;
alter table public.reservations enable row level security;
alter table public.calendar_blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.incidents enable row level security;
alter table public.payments enable row level security;
alter table public.owner_statements enable row level security;
alter table public.automation_rules enable row level security;
alter table public.automation_runs enable row level security;
alter table public.channel_sync_events enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid() or public.is_operator());
create policy "profiles self update" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "operators manage owner accounts" on public.owner_accounts for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read own account" on public.owner_accounts for select using (profile_id = auth.uid());

create policy "operators manage properties" on public.properties for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read properties" on public.properties for select using (public.can_manage_property(id));

create policy "operators manage listings" on public.property_listings for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read listings" on public.property_listings for select using (public.can_manage_property(property_id));

create policy "operators manage guests" on public.guests for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read guests through reservations" on public.guests for select using (
  exists (
    select 1 from public.reservations r
    where r.guest_id = guests.id and public.can_manage_property(r.property_id)
  )
);

create policy "operators manage reservations" on public.reservations for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read reservations" on public.reservations for select using (public.can_manage_property(property_id));

create policy "operators manage calendar blocks" on public.calendar_blocks for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read calendar blocks" on public.calendar_blocks for select using (public.can_manage_property(property_id));

create policy "operators manage conversations" on public.conversations for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read conversations" on public.conversations for select using (public.can_manage_property(property_id));

create policy "operators manage messages" on public.conversation_messages for all using (public.is_operator()) with check (public.is_operator());
create policy "related users read messages" on public.conversation_messages for select using (public.can_view_conversation(conversation_id));

create policy "operators manage tasks" on public.tasks for all using (public.is_operator()) with check (public.is_operator());
create policy "assignees read tasks" on public.tasks for select using (assigned_to = auth.uid() or public.can_manage_property(property_id));
create policy "assignees update tasks" on public.tasks for update using (assigned_to = auth.uid() or public.is_operator()) with check (assigned_to = auth.uid() or public.is_operator());

create policy "operators manage checklist" on public.task_checklist_items for all using (public.is_operator()) with check (public.is_operator());
create policy "task assignees read checklist" on public.task_checklist_items for select using (
  exists (select 1 from public.tasks t where t.id = task_id and (t.assigned_to = auth.uid() or public.can_manage_property(t.property_id)))
);

create policy "operators manage incidents" on public.incidents for all using (public.is_operator()) with check (public.is_operator());
create policy "owners and assignees read incidents" on public.incidents for select using (assigned_to = auth.uid() or public.can_manage_property(property_id));
create policy "assignees update incidents" on public.incidents for update using (assigned_to = auth.uid() or public.is_operator()) with check (assigned_to = auth.uid() or public.is_operator());

create policy "operators manage payments" on public.payments for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read payments" on public.payments for select using (
  exists (select 1 from public.reservations r where r.id = reservation_id and public.can_manage_property(r.property_id))
);

create policy "operators manage owner statements" on public.owner_statements for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read owner statements" on public.owner_statements for select using (
  exists (
    select 1 from public.owner_accounts oa
    where oa.id = owner_account_id and oa.profile_id = auth.uid()
  )
);

create policy "operators manage automation rules" on public.automation_rules for all using (public.is_operator()) with check (public.is_operator());
create policy "operators read automation runs" on public.automation_runs for select using (public.is_operator());
create policy "operators insert automation runs" on public.automation_runs for insert with check (public.is_operator());

create policy "operators manage sync events" on public.channel_sync_events for all using (public.is_operator()) with check (public.is_operator());

create policy "operators manage documents" on public.documents for all using (public.is_operator()) with check (public.is_operator());
create policy "owners read documents" on public.documents for select using (
  property_id is not null and public.can_manage_property(property_id)
);

create policy "users read own notifications" on public.notifications for select using (user_id = auth.uid() or public.is_operator());
create policy "users update own notifications" on public.notifications for update using (user_id = auth.uid() or public.is_operator()) with check (user_id = auth.uid() or public.is_operator());
create policy "operators insert notifications" on public.notifications for insert with check (public.is_operator());
