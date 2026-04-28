insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-media', 'property-media', true, 52428800, array['image/jpeg', 'image/png', 'image/webp']),
  ('reservation-documents', 'reservation-documents', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('incident-attachments', 'incident-attachments', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "authenticated read public property media"
on storage.objects for select
using (bucket_id = 'property-media' and auth.role() = 'authenticated');

create policy "operators manage property media"
on storage.objects for all
using (bucket_id = 'property-media' and public.is_operator())
with check (bucket_id = 'property-media' and public.is_operator());

create policy "users read avatars"
on storage.objects for select
using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "users manage own avatar"
on storage.objects for all
using (bucket_id = 'avatars' and owner = auth.uid())
with check (bucket_id = 'avatars' and owner = auth.uid());

create policy "operators manage reservation documents"
on storage.objects for all
using (bucket_id = 'reservation-documents' and public.is_operator())
with check (bucket_id = 'reservation-documents' and public.is_operator());

create policy "operators manage incident attachments"
on storage.objects for all
using (bucket_id = 'incident-attachments' and public.is_operator())
with check (bucket_id = 'incident-attachments' and public.is_operator());
