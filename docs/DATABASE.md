# Base de datos

## Migraciones

```text
supabase/migrations/
  0001_initial_schema.sql
  0002_rls_policies.sql
  0003_storage.sql
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

## Storage

Buckets preparados:

- `property-media`
- `reservation-documents`
- `incident-attachments`
- `avatars`

## Seed

`supabase/seed.sql` crea usuarios demo, propietario demo, propiedades, listings por canal, huespedes, reservas, conversaciones, mensajes, tareas, incidencias, pagos y automatizaciones.

## Pendientes

- Generar tipos reales con `pnpm db:types`.
- Conectar UI a Supabase.
- Crear Edge Functions para operaciones sensibles.
- Auditar politicas RLS antes de produccion.
