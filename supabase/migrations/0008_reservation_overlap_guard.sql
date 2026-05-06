create extension if not exists btree_gist;

alter table public.reservations
add constraint reservations_no_active_date_overlap
exclude using gist (
  property_id with =,
  daterange(check_in, check_out, '[)') with &&
)
where (status in ('pending', 'confirmed', 'checked_in'));
