# Base de datos

## Migraciones

```text
supabase/migrations/
  0001_initial_schema.sql
  0002_rls_policies.sql
  0003_storage.sql
  0004_ai_foundation.sql
  0005_channel_accounts.sql
```

## Tablas principales

- `profiles`: usuarios de la plataforma.
- `owner_accounts`: propietarios y entidades de pago.
- `properties`: activos/alojamientos.
- `property_listings`: publicacion por canal.
- `channel_accounts`: preparacion de cuentas externas por canal sin secretos.
- `guests`: CRM de huespedes.
- `reservations`: reservas por canal.
- `calendar_blocks`: bloqueos de calendario.
- `conversations`: hilos de inbox.
- `conversation_messages`: mensajes del inbox.
- `tasks`: tareas de operacion.
- `task_checklist_items`: checklist por tarea.
- `incidents`: incidencias y danos.
- `payments`: pagos asociados a reservas.
- `owner_statements`: liquidaciones a propietarios.
- `automation_rules`: reglas de automatizacion.
- `automation_runs`: ejecuciones de automatizaciones.
- `channel_sync_events`: eventos de sincronizacion por canal.
- `documents`: documentos, evidencias y adjuntos.
- `notifications`: notificaciones internas.

## Tablas preparadas para IA

- `operational_events`: eventos historicos de producto y operacion para entrenar o auditar modelos futuros.
- `message_labels`: etiquetas humanas, de reglas o de modelo sobre mensajes y conversaciones.
- `task_outcomes`: resultados de tareas y cumplimiento de SLA.
- `reservation_snapshots`: fotografia diaria de reservas para forecasting y booking pace.
- `pricing_observations`: observaciones de precio, sugerencias, aprobaciones y conversion.
- `incident_features`: variables historicas de incidencias para riesgo, recurrencia y coste.
- `model_predictions`: predicciones o recomendaciones explicables, siempre revisables.
- `ai_audit_log`: trazabilidad de prompts, respuestas, aprobacion humana y riesgo.
- `quality_audit_memories`: memoria del auditor visual/funcional para evitar regresiones repetidas.

Estas tablas no activan IA automaticamente. Su objetivo es guardar datos limpios desde el MVP para poder incorporar modelos explicables mas adelante sin rehacer la base.

La estrategia IA canonica esta en `AI.md`.

## Workflows de huesped

Los workflows de check-in/check-out del MVP viven sobre `automation_rules` para evitar duplicar modelos. La pantalla `/workflows` filtra los triggers `reservation_confirmed`, `checkin_24h`, `checkin_1h` y `checkout_time`, y usa `template`, `channel`, `delay_minutes` y `enabled` como fuente de verdad.

Las variables visibles en UI (`{{guest_name}}`, `{{property_name}}`, `{{checkin_date}}`, `{{checkout_date}}`, `{{access_code}}`, `{{house_rules}}`, `{{support_phone}}`) son placeholders de plantilla. La resolucion base ya vive en `@wiahost/shared` para preview y validacion visual; el envio real reutilizara ese motor cuando conectemos proveedores de email/WhatsApp/canales.

## Distribucion y canales

El modulo `/distribution` conecta dos tablas ya existentes:

- `property_listings`: publicacion de una propiedad en un canal, con estado, URL publica, ID externo, slug para web directa y bandera `sync_enabled`.
- `channel_accounts`: estado de preparacion de una cuenta externa, modo de integracion (`manual`, `oauth`, `api_key`, `partner_api`, `ical_only`), health, scopes y notas. No guarda tokens ni claves API.
- `channel_sync_events`: registro de cada intercambio con canales, con direccion `inbound/outbound`, estado de sync, payload JSON y error si existe.

Esto no publica todavia en Airbnb/Booking/Vrbo de forma automatica. Deja preparado el modelo operativo para API oficiales, iCal, web directa y normalizacion de mensajes entrantes.

El export iCal publico vive en `/api/ical/[slug]` y usa `property_listings.public_slug` para localizar el anuncio publicado. El feed combina `reservations` confirmadas/en curso/pendientes y `calendar_blocks`, pero solo emite estados genericos como `Reservado` o `Bloqueado`; no incluye nombre, email, telefono ni notas privadas del huesped.

El import iCal basico vive en `/api/ical/import` y crea `calendar_blocks` a partir de eventos `VEVENT`. Antes de insertar compara propiedad, canal, fechas y razon para evitar duplicados simples. Cada import registra un `channel_sync_events` inbound con accion `ical_import`.

## Motor de reserva directa

La ruta publica `/book/[slug]` usa `property_listings.public_slug` como identificador del anuncio. Si el listing esta publicado, muestra los datos base de la propiedad y permite enviar una solicitud.

Al enviar el formulario se crean registros conectados:

- `guests`: contacto del huesped.
- `reservations`: reserva en estado `inquiry`, canal `direct`, fechas, personas e importe estimado.
- `conversations`: hilo operativo para seguimiento.
- `conversation_messages`: primer mensaje inbound desde la web directa.
- `channel_sync_events`: evento `direct_booking_inquiry` para auditoria de canal.

La confirmacion no es automatica. Operaciones revisa disponibilidad, condiciones y precio final antes de aceptar.

## Pipeline de leads directos

El modulo `/leads` no crea una tabla nueva en el MVP. Usa `reservations` como fuente de verdad para solicitudes directas con `channel = direct` y estados `inquiry`, `pending`, `confirmed` o `cancelled`.

La pantalla combina datos de:

- `reservations`: fechas, importe, canal, estado y numero de huespedes.
- `guests`: nombre, email y telefono del contacto.
- `properties`: activo solicitado.
- `conversations`: hilo operativo para responder desde inbox.
- `payments`: solicitud de pago pendiente cuando operaciones prepara el checkout directo.

Preparar pago crea o reutiliza un `payments` pendiente con `provider = direct_checkout`, vinculado a la reserva y al huesped. Tambien genera un enlace tokenizado en `payments.metadata.checkout`, expuesto como `/checkout/[paymentId]?token=...`, y deja `provider_payment_id`. Si hay `STRIPE_SECRET_KEY`, `provider` pasa a `stripe`, `provider_payment_id` guarda la Checkout Session y `metadata.checkout.url` apunta a Stripe. Si no hay Stripe, se mantiene checkout demo local. Si la solicitud estaba en `inquiry`, pasa a `pending` para indicar que falta confirmacion final. Tambien registra `channel_sync_events.payload.action = direct_payment_request_prepared` y `direct_checkout_link_created`.

Convertir un lead a confirmado o cancelado actualiza `reservations.status` mediante Server Action/API. El checkout demo confirma pagos desde `/api/checkout/[paymentId]/confirm`, marca `payments.status = paid`, rellena `paid_at`, actualiza el metadata y confirma la reserva pendiente. En produccion, Stripe confirma pagos desde `POST /api/stripe/webhook` tras verificar la firma del evento y comprobar `payment_status = paid`; los pagos diferidos quedan cubiertos por `checkout.session.async_payment_succeeded`.

## Mensajes entrantes de canales

La normalizacion de mensajes entrantes no crea tablas nuevas. El endpoint `/api/channels/messages` y el formulario de `/inbox` reutilizan:

- `guests`: crea o reutiliza contacto por email cuando existe.
- `conversations`: abre o reutiliza hilo por reserva o por propiedad/contacto.
- `conversation_messages`: guarda el mensaje con `direction = inbound` y canal original.
- `channel_sync_events`: registra accion `inbound_message` para auditoria e integraciones futuras.

Los canales `email`, `whatsapp`, `sms` e `inbox` se registran como sync `manual` porque `channel_sync_events.channel` representa canales de distribucion. Airbnb, Booking y Vrbo conservan su canal.

## Pricing y revenue

El modulo `/pricing` activa la tabla `pricing_observations`. Cada registro guarda propiedad, fecha, origen/canal, precio actual, sugerido, aprobado, final, ocupacion, booking pace, lead time y estado de conversion.

Esta capa no cambia automaticamente tarifas publicadas. Es un control humano y auditable para comparar recomendaciones contra resultado real antes de integrar PriceLabs, motores de pricing o automatizaciones.

Cuando operaciones pulsa "Registrar sync precio", se crea un `channel_sync_events` outbound con `payload.action = price_update`, importe, moneda, fecha y referencia a la observacion. Si `source` coincide con un canal soportado se usa ese canal; si no, queda como `manual`.

## Auditoria operativa

La tabla `operational_events` ya tiene modulo web en `/audit` y API REST en `/api/audit-events`. Permite registrar eventos manuales o de sistema con `event_name`, `entity_type`, entidad vinculada, fuente, actor y `metadata`.

Esta capa sirve para soporte, investigacion de incidencias, debugging funcional y datasets futuros de automatizacion/IA sin guardar informacion innecesaria.

## Liquidaciones de propietario

La tabla `owner_statements` ya esta conectada desde `/statements` y `/api/owner-statements`. Permite preparar statements por propietario, propiedad opcional y periodo, con ingresos brutos, comisiones, costes de limpieza, mantenimiento, payout neto y estado de sincronizacion.

La fase posterior puede generar PDFs, notificaciones al propietario y pago automatizado, pero el dato financiero base ya queda normalizado.

## Notificaciones

La tabla `notifications` ya esta conectada desde `/notifications`, la campana del shell y `/api/notifications`. En el MVP permite crear avisos internos para el usuario autenticado y marcar uno o todos como leidos. Sirve como base para eventos de mensajes, pagos, incidencias, owner statements y automatizaciones.

## Storage

Buckets preparados:

- `property-media`
- `reservation-documents`
- `incident-attachments`
- `avatars`

## Documentos y evidencias

El modulo `documents` ya esta conectado desde la web. En el MVP guarda metadatos y la ruta de storage para evidencias de check-in, contratos, adjuntos de incidencias o archivos operativos. Cada documento puede quedar asociado a una propiedad, una reserva y/o una incidencia.

El upload avanzado de ficheros se activara sobre los buckets `reservation-documents` e `incident-attachments`; hasta entonces, la pantalla conserva trazabilidad del archivo y contexto operativo.

## Seed

`supabase/seed.sql` crea usuarios demo, propietario demo, propiedades, listings por canal, huespedes, reservas, conversaciones, mensajes, tareas, incidencias, pagos y automatizaciones.

## Pendientes

- Generar tipos reales con `pnpm db:types`.
- Completar upload avanzado de documentos y evidencias desde la UI.
- Crear Edge Functions para operaciones sensibles.
- Auditar politicas RLS antes de produccion.
- Conectar tracking real de eventos y feedback humano desde la web.
