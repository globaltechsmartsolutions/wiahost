# Testing Risk Matrix

Este documento convierte riesgos reales de PMS, channel managers y apps moviles en pruebas automatizables para WIAHost.

## Principios

- Probar primero lo que puede costar dinero, reputacion o datos: doble reserva, pagos falsos, permisos rotos, mensajes perdidos, pushes no entregadas y regresiones visuales.
- Cada bug recurrente debe terminar en una prueba automatizada o en un checklist manual claro si depende de un dispositivo/cuenta externa.
- Los tests deben validar comportamiento observable: codigo HTTP, estado en base de datos, auditoria, UI visible y no exposicion de secretos.

## Riesgos criticos y cobertura

| Riesgo | Por que importa | Cobertura actual | Siguiente ampliacion |
| --- | --- | --- | --- |
| Doble reserva por solape de fechas | Es el fallo mas danino en alquiler vacacional: reubicaciones, penalizaciones y mala reseña. | Guard de disponibilidad en servicios, constraint SQL `reservations_no_active_date_overlap`, unit tests de overlap y E2E anti-overbooking. | Test Supabase local con migracion aplicada y concurrencia real. |
| Conflictos por iCal duplicado o lento | iCal puede generar duplicados, conflictos fantasma y ventanas de desincronizacion. | Import iCal deduplica contra base y dentro del feed, limita 100 eventos, registra `channel_sync_events`, unit tests de duplicados/folded lines. | Fuzzer de feeds ICS con timezone, UID y eventos cancelados. |
| Pago/webhook falso o duplicado | Stripe reintenta webhooks y exige firma/raw body; procesar duplicados puede duplicar cobros o estados. | Webhook rechaza firma ausente, decision de evento cubierta, confirmacion demo/Stripe idempotente, unit tests y E2E defensivo. | Test con firma real generada por Stripe SDK y replay de mismo event id cuando haya tabla de eventos procesados. |
| RLS/autorizacion silenciosa | Supabase puede devolver arrays vacios si RLS filtra datos; no debe depender solo del frontend. | Auditor `quality:db`, RLS en migraciones, API security E2E para anonimos, request IDs consistentes. | Tests por rol con usuarios owner/operator reales en Supabase local. |
| Push tokens muertos/permisos | Expo documenta tokens invalidados y errores por credenciales/FCM/APNs. | Helper valida tokens, chunk de 100, errores Expo auditables, tests de request-level errors y tickets `DeviceNotRegistered`. | Suite manual en Android/iOS fisico con permisos, background y tap handling. |
| Documentos inseguros | Rutas `../` o buckets incorrectos pueden filtrar evidencias/documentos. | Validadores y servicios rechazan storage paths inseguros antes de Storage; E2E security. | Test por bucket con RLS Storage en Supabase local. |
| Degradacion visual/responsive | El dashboard puede quedar gigante, desalineado o con scroll horizontal en portatiles. | Visual snapshots estrictos de primer viewport, checks de overflow y memoria de auditoria. | Ampliar snapshots al resto de modulos cuando se estabilicen datos dinamicos. |
| Rate limit/API abuse | Endpoints publicos de booking/checkout pueden recibir spam. | Rate limit unit tests y E2E defensivo para checkout/webhook. | E2E de rate limit con identidad/IP controlada y cabeceras `Retry-After`. |

## Fuentes de investigacion

- Hostaway: double booking y necesidad de sync en tiempo real: https://www.hostaway.com/glossary/double-booking/
- Bolder Technologies: errores de integracion OTA/PMS, calendario, pricing y sync logs: https://www.boldertechnologies.net/top-vacation-rental-api-integration-mistakes/
- Hostaway: two-way sync y canales: https://www.hostaway.com/glossary/two-way-sync/
- Stripe webhooks: firma, raw payload y eventos duplicados: https://docs.stripe.com/webhooks
- Supabase RLS: `auth.uid()` nulo, politicas y roles: https://supabase.com/docs/guides/database/postgres/row-level-security
- Expo Push Service: tickets, `DeviceNotRegistered`, limites y errores: https://docs.expo.dev/push-notifications/sending-notifications/
- Expo push troubleshooting: https://docs.expo.dev/push-notifications/faq/
- iCalendar RFC 5545 para fechas, UID y recurrencias: https://www.ietf.org/rfc/rfc5545.txt

## Checklist de regresion por release

- Ejecutar `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm quality:ci`.
- Ejecutar `pnpm --filter web test:e2e` antes de demos funcionales.
- Ejecutar `pnpm test:visual` despues de tocar dashboard, shell o first viewport.
- Ejecutar `pnpm test:a11y` despues de tocar formularios, navegacion o estados vacios.
- Ejecutar `pnpm release:check` antes de publicar staging/production.
- Si se tocan push/mobile: validar manualmente APK en Android fisico y anotar resultado en `docs/RELEASE.md`.
- Si se tocan pagos: probar webhook firmado con Stripe CLI/Dashboard antes de produccion.
- Si se tocan migraciones/RLS: ejecutar `pnpm db:reset`, `pnpm db:types` y `pnpm quality:db`.
