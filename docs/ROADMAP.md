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
- Reservas reales con creacion manual y cambio de estado.
- Multi-calendario desde base de datos.
- Inbox inicial con respuesta desde el panel.
- Tareas de limpieza/mantenimiento con creacion y cambio de estado.
- Incidencias con creacion, coste estimado y cambio de estado.
- API web/mobile para reservas, tareas, incidencias e inbox.
- Detalle navegable de reservas, tareas, incidencias y conversaciones.
- Suite robusta de calidad web: unit tests, E2E, visual regression, accesibilidad y Lighthouse CI.
- Memoria de auditoria para evitar regresiones repetidas.

### Estado actual de Fase 1

- Implementado: dashboard operativo, paginas de reservas, inbox, tareas e incidencias conectadas a Supabase con fallback demo.
- Implementado: Server Actions para crear reservas manuales, crear tareas, crear incidencias, responder conversaciones y actualizar estados.
- Implementado: servicios de mutacion compartidos entre Server Actions y API routes para evitar duplicar logica.
- Implementado: API routes autenticadas para listar/crear reservas, tareas, incidencias, inbox y mensajes.
- Implementado: paginas de detalle para reservas, tareas, incidencias y conversaciones con fallback demo.
- Implementado: propiedades con lista, detalle, edicion, PATCH API y archivo controlado mediante Server Action/API.
- Implementado: edicion completa de reservas, tareas e incidencias mediante pantallas protegidas, Server Actions y PATCH API.
- Implementado: feedback visual basico tras crear reservas/tareas/incidencias, enviar respuestas y actualizar estados.
- Implementado: filtros operativos en reservas, tareas, incidencias e inbox por busqueda y estado/canal/prioridad/severidad segun modulo.
- Implementado: Supabase local verificado con Auth, seed demo, tipos generados y escrituras reales desde UI/API.
- Implementado: proteccion de rutas web con `proxy.ts` de Next.js 16 usando Supabase Auth.
- Implementado: Playwright E2E inicial para landing/login/register, redireccion anonima, login demo, creacion/edicion de reserva UI/API y mutaciones completas de tareas, incidencias e inbox.
- Implementado: auditoria de accesibilidad con axe sobre rutas publicas, protegidas, detalle y edicion de operaciones.
- Implementado: baseline visual inicial para landing/auth y check de alineacion del dashboard.
- Implementado: visual checks de densidad/overflow para rutas operativas, detalle/edicion de operaciones y gestion de propiedades en desktop portatil.
- Implementado: dashboard sobre grid compartido de 12 columnas para que los huecos entre cards queden alineados aunque cambie el numero de cards por fila.
- Implementado: breakpoint responsive del dashboard para evitar calendario apretado y scrollbar horizontal interno en 1366, 1440, 1536 y 1920.
- Implementado: escala compacta de dashboard para portatil, con cuatro metricas por fila y hero menos sobredimensionado.
- Implementado: primera vista del dashboard mas densa, con sidebar/topbar/hero/cards compactos y calendario visible antes.
- Implementado: memoria versionada en `quality/audit-memory` con reglas visuales, riesgos, rutas y hallazgos previos.
- Implementado: CI inicial con typecheck, lint, unit tests, build web y Lighthouse CI no bloqueante con reportes como artefacto.
- Pendiente inmediato: conectar owners/settings a Supabase, snapshots visuales estables por modulo y endurecer Lighthouse cuando haya baseline historico.

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
