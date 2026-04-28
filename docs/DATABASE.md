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
- Conectar tracking real de eventos y feedback humano desde la web.
