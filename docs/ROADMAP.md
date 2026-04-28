# Roadmap

## Fase 0 - Fundacion actual

- Monorepo pnpm + Turborepo.
- Web Next.js.
- UI command center.
- Supabase schema.
- RLS inicial.
- Storage inicial.
- Seed demo.
- Documentacion base.

## Fase 1 - MVP web conectado

- Supabase Auth.
- Login/register reales.
- Profiles y roles.
- Dashboard con queries reales.
- CRUD de propiedades.
- Reservas reales.
- Multi-calendario desde base de datos.
- Inbox inicial.
- Tareas de limpieza/mantenimiento.
- Incidencias.
- Suite robusta de calidad web: unit tests, E2E, visual regression, accesibilidad y Lighthouse CI.
- Memoria de auditoria para evitar regresiones repetidas.

## Fase 2 - Operacion PMS

- Automatizaciones reales.
- Plantillas de mensajes.
- Check-in/check-out workflows.
- Documentos y evidencias.
- Owner portal.
- Owner statements.
- Pagos iniciales.
- Auditoria de eventos.

## Fase 3 - Distribucion y canales

- Publicacion directa.
- Motor de reserva directa.
- Integraciones con canales mediante API cuando sea viable.
- Import/export iCal como paso intermedio si APIs no estan disponibles.
- Channel sync events.
- Control de disponibilidad y precios.

## Fase 4 - App movil

- Crear `apps/mobile` con Expo.
- Login Supabase.
- Dashboard mobile.
- Reservas, tareas, incidencias e inbox.
- Push notifications.
- EAS Build.
- Play Store internal testing.
- Publicacion Android.

## Fase 5 - IA y automatizacion avanzada

- Documento canonico: `AI.md`.
- Capa de base de datos preparada para IA: eventos, labels, predicciones, auditoria y memoria visual/funcional.
- Cinco modulos IA: inbox inteligente, automatizaciones contextuales, operaciones, revenue advisor y riesgo/incidencias.
- Instrumentacion, structured outputs, semantic memory, tool calling, evals, observabilidad y guardrails.
- Dataset historico de eventos, outcomes y feedback humano.
- Feature engineering para pricing, reservas, tareas, incidencias e inbox.
- Respuestas asistidas en inbox.
- Clasificacion de urgencia.
- Deteccion de sentimiento.
- Resumen de conversaciones.
- Recomendaciones operativas.
- Pricing insights.
- Segmentacion de propiedades y reservas con clustering.
- Deteccion de anomalias operativas.
- Modelos secuenciales futuros para inbox, ocupacion, pricing y patrones de incidencias.
- Copiloto operativo con LLM/Transformers y aprobacion humana.

## Fase 6 - Produccion SaaS

- Multi-tenant real.
- Facturacion SaaS.
- Observabilidad.
- Logs y auditoria.
- Backups.
- Seguridad avanzada.
