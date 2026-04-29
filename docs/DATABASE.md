# Base de datos

## Migraciones

```text
supabase/migrations/
  0001_initial_schema.sql
  0002_rls_policies.sql
  0003_storage.sql
  0004_ai_foundation.sql
```

## Tablas principales

- `profiles`: usuarios de la plataforma.
- `owner_accounts`: propietarios y entidades de pago.
- `properties`: activos/alojamientos.
- `property_listings`: publicacion por canal.
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

Las variables visibles en UI (`{{guest_name}}`, `{{property_name}}`, `{{checkin_date}}`, `{{checkout_date}}`, `{{access_code}}`, `{{house_rules}}`, `{{support_phone}}`) son placeholders de plantilla. La resolucion real por reserva se implementara cuando conectemos el motor de envio.

## Distribucion y canales

El modulo `/distribution` conecta dos tablas ya existentes:

- `property_listings`: publicacion de una propiedad en un canal, con estado, URL publica, ID externo, slug para web directa y bandera `sync_enabled`.
- `channel_sync_events`: registro de cada intercambio con canales, con direccion `inbound/outbound`, estado de sync, payload JSON y error si existe.

Esto no publica todavia en Airbnb/Booking/Vrbo de forma automatica. Deja preparado el modelo operativo para API oficiales, iCal, web directa y normalizacion de mensajes entrantes.

## Motor de reserva directa

La ruta publica `/book/[slug]` usa `property_listings.public_slug` como identificador del anuncio. Si el listing esta publicado, muestra los datos base de la propiedad y permite enviar una solicitud.

Al enviar el formulario se crean registros conectados:

- `guests`: contacto del huesped.
- `reservations`: reserva en estado `inquiry`, canal `direct`, fechas, personas e importe estimado.
- `conversations`: hilo operativo para seguimiento.
- `conversation_messages`: primer mensaje inbound desde la web directa.
- `channel_sync_events`: evento `direct_booking_inquiry` para auditoria de canal.

La confirmacion no es automatica. Operaciones revisa disponibilidad, condiciones y precio final antes de aceptar.

## Auditoria operativa

La tabla `operational_events` ya tiene modulo web en `/audit` y API REST en `/api/audit-events`. Permite registrar eventos manuales o de sistema con `event_name`, `entity_type`, entidad vinculada, fuente, actor y `metadata`.

Esta capa sirve para soporte, investigacion de incidencias, debugging funcional y datasets futuros de automatizacion/IA sin guardar informacion innecesaria.

## Liquidaciones de propietario

La tabla `owner_statements` ya esta conectada desde `/statements` y `/api/owner-statements`. Permite preparar statements por propietario, propiedad opcional y periodo, con ingresos brutos, comisiones, costes de limpieza, mantenimiento, payout neto y estado de sincronizacion.

La fase posterior puede generar PDFs, notificaciones al propietario y pago automatizado, pero el dato financiero base ya queda normalizado.

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
