insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@wiahost.local', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin WIAHost","role":"admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'operaciones@wiahost.local', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Laura Operaciones","role":"operator"}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@wiahost.local', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Propietario","role":"owner"}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'limpieza@wiahost.local', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marta Limpieza","role":"housekeeping"}', now(), now())
on conflict (id) do nothing;

insert into public.owner_accounts (id, profile_id, display_name, company_name)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Carlos Propietario', 'WIA Demo Assets')
on conflict (id) do nothing;

insert into public.properties (
  id,
  owner_account_id,
  created_by,
  name,
  internal_name,
  description,
  address_line,
  city,
  province,
  postal_code,
  bedrooms,
  bathrooms,
  max_guests,
  base_price,
  cleaning_fee,
  status,
  checkin_instructions,
  house_rules,
  amenities
)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Atico Gran Via Sky', 'MAD-GV-01', 'Alojamiento premium con terraza y llegada autonoma.', 'Gran Via 28', 'Madrid', 'Madrid', '28013', 2, 2, 4, 185, 55, 'active', 'Smart lock. Codigo enviado 1 hora antes del check-in.', 'No fiestas. Silencio desde las 22:00.', '["wifi","smart_lock","terrace","workspace"]'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Loft Malaga Centro', 'AGP-CT-02', 'Loft luminoso para escapadas urbanas.', 'Calle Larios 8', 'Malaga', 'Malaga', '29005', 1, 1, 2, 120, 40, 'active', 'Recogida de llaves en caja de seguridad.', 'No mascotas sin autorizacion.', '["wifi","self_checkin","ac"]')
on conflict (id) do nothing;

insert into public.property_listings (property_id, channel, external_listing_id, public_slug, title, status, channel_url, sync_enabled)
values
  ('20000000-0000-0000-0000-000000000001', 'airbnb', 'airbnb-demo-1', 'atico-gran-via-sky', 'Atico Gran Via Sky', 'published', 'https://airbnb.example/listings/airbnb-demo-1', true),
  ('20000000-0000-0000-0000-000000000001', 'booking', 'booking-demo-1', null, 'Atico Gran Via Sky', 'published', 'https://booking.example/hotel/es/demo.html', true),
  ('20000000-0000-0000-0000-000000000002', 'direct', 'direct-demo-2', 'loft-malaga-centro', 'Loft Malaga Centro', 'published', 'http://localhost:3000/book/loft-malaga-centro', false)
on conflict do nothing;

insert into public.guests (id, full_name, email, phone, preferred_language, tags)
values
  ('30000000-0000-0000-0000-000000000001', 'Sofia Martin', 'sofia@example.com', '+34600000001', 'es', '["repeat_guest"]'),
  ('30000000-0000-0000-0000-000000000002', 'James Walker', 'james@example.com', '+447000000001', 'en', '["vip"]')
on conflict (id) do nothing;

insert into public.reservations (
  id,
  property_id,
  guest_id,
  channel,
  external_reservation_id,
  status,
  check_in,
  check_out,
  guests_count,
  nightly_rate,
  cleaning_fee,
  taxes_amount,
  total_amount,
  payout_amount,
  security_deposit
)
values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'airbnb', 'res-airbnb-1', 'confirmed', current_date + 1, current_date + 4, 2, 185, 55, 35, 645, 560, 200),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'direct', 'res-direct-2', 'checked_in', current_date - 1, current_date + 2, 2, 120, 40, 20, 420, 390, 150)
on conflict (id) do nothing;

insert into public.conversations (id, property_id, reservation_id, guest_id, status, assigned_to, last_message_at)
values ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'open', '00000000-0000-0000-0000-000000000002', now())
on conflict (id) do nothing;

insert into public.conversation_messages (conversation_id, sender_profile_id, channel, direction, body, sent_at)
values
  ('50000000-0000-0000-0000-000000000001', null, 'airbnb', 'inbound', 'Hola, llegaremos sobre las 19:30. Podriamos hacer check-in autonomo?', now() - interval '20 minutes'),
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'airbnb', 'outbound', 'Si, os enviaremos el codigo una hora antes de la llegada.', now() - interval '10 minutes');

insert into public.tasks (id, property_id, reservation_id, assigned_to, created_by, type, status, priority, title, description, due_at)
values
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'cleaning', 'scheduled', 'high', 'Preparar Atico Gran Via', 'Limpieza completa, amenities y revision de smart lock.', current_date + time '11:00'),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', null, '00000000-0000-0000-0000-000000000002', 'maintenance', 'open', 'medium', 'Revisar aire acondicionado', 'El huesped indica ruido intermitente.', now() + interval '6 hours')
on conflict (id) do nothing;

insert into public.incidents (id, property_id, reservation_id, reported_by, assigned_to, status, severity, title, description, estimated_cost)
values ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', null, 'open', 'medium', 'Ruido en aire acondicionado', 'Posible incidencia de mantenimiento antes del proximo check-in.', 90)
on conflict (id) do nothing;

insert into public.payments (reservation_id, guest_id, status, provider, amount, paid_at)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'authorized', 'airbnb', 645, now()),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'paid', 'stripe', 420, now() - interval '2 days');

insert into public.automation_rules (name, trigger, channel, template, enabled, delay_minutes, created_by)
values
  ('Enviar instrucciones 24h antes', 'checkin_24h', 'email', 'Hola {{guest_name}}, manana empieza tu estancia en {{property_name}}.', true, 0, '00000000-0000-0000-0000-000000000002'),
  ('Aviso a limpieza tras checkout', 'checkout_time', 'inbox', 'Preparar limpieza de {{property_name}} tras checkout.', true, 30, '00000000-0000-0000-0000-000000000002');
