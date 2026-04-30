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
- Implementado: medicion de resultados de tareas en `task_outcomes`, con SLA, desviacion y resultado visible en detalle.
- Implementado: owners conectado a Supabase con resumen de propietarios, activos, ingresos, payout e incidencias.
- Implementado: settings conectado a Supabase con lectura, actualizacion del perfil operativo y readiness tecnico compartido con `/api/health`.
- Implementado: CRM de huespedes conectado a Supabase con listado, filtro, alta y API GET/POST.
- Implementado: ficha y edicion de huespedes con contexto de reservas, conversaciones, notas internas y API GET/PATCH.
- Implementado: calendario multi-propiedad conectado a la matriz real de reservas, excluyendo propiedades archivadas, con alta, edicion y eliminacion de bloqueos manuales por UI/API.
- Implementado: feedback visual basico tras crear reservas/tareas/incidencias, enviar respuestas y actualizar estados.
- Implementado: filtros operativos en reservas, tareas, incidencias e inbox por busqueda y estado/canal/prioridad/severidad segun modulo.
- Implementado: busqueda global protegida desde topbar y `/search` sobre reservas, huespedes, propiedades, tareas, incidencias e inbox.
- Implementado: priorizacion explicable de inbox por SLA, check-in cercano y senales operativas/acceso, con motivo visible para el equipo.
- Implementado: actualizacion de estado de conversaciones desde inbox y API `PATCH /api/inbox/:conversationId` para resolver, reabrir o archivar hilos.
- Implementado: eventos automaticos de auditoria para respuestas y cambios de estado de conversaciones.
- Implementado: eventos automaticos de auditoria para creacion, edicion y cambios de estado de reservas, tareas, incidencias y leads directos.
- Implementado: filtros de auditoria por busqueda, fuente y entidad para revisar trazabilidad operativa sin perderse en el timeline.
- Implementado: ficha de detalle de evento de auditoria con contexto, referencias tecnicas y metadata JSON.
- Implementado: etiquetas humanas en detalle de inbox y API `POST /api/inbox/:conversationId/labels` para capturar urgencia, sentimiento, categoria, intencion e idioma como dataset futuro de IA.
- Implementado: Supabase local verificado con Auth, seed demo, tipos generados y escrituras reales desde UI/API.
- Implementado: proteccion de rutas web con `proxy.ts` de Next.js 16 usando Supabase Auth.
- Implementado: Playwright E2E inicial para landing/login/register, redireccion anonima, login demo, creacion/edicion de reserva UI/API, owners/settings, guests/calendar y mutaciones completas de tareas, incidencias e inbox.
- Implementado: auditoria de accesibilidad con axe sobre rutas publicas, protegidas, calendario, guests, detalle, edicion de operaciones, owners y settings.
- Implementado: baseline visual inicial para landing/auth y check de alineacion del dashboard.
- Implementado: visual checks de densidad/overflow para rutas operativas, detalle/edicion de operaciones, calendar/guests, owners/settings y gestion de propiedades en desktop portatil.
- Implementado: dashboard sobre grid compartido de 12 columnas para que los huecos entre cards queden alineados aunque cambie el numero de cards por fila.
- Implementado: breakpoint responsive del dashboard para evitar calendario apretado y scrollbar horizontal interno en 1366, 1440, 1536 y 1920.
- Implementado: escala compacta de dashboard para portatil, con cuatro metricas por fila y hero menos sobredimensionado.
- Implementado: primera vista del dashboard mas densa, con sidebar/topbar/hero/cards compactos y calendario visible antes.
- Implementado: navegacion responsive del shell protegido con menu lateral mobile/tablet y prueba visual contra overflow horizontal.
- Implementado: headers compactos de modulos protegidos, con descripcion lateral en desktop y test visual para evitar paginas sobredimensionadas en portatil.
- Implementado: estados globales de carga/error para rutas Next.js, con fallback visual de producto y codigo de seguimiento de errores.
- Implementado: memoria versionada en `quality/audit-memory` con reglas visuales, riesgos, rutas y hallazgos previos.
- Implementado: auditor estatico `pnpm quality:routes` para verificar que el inventario de rutas mantiene cobertura visual/accesibilidad.
- Implementado: auditor estatico `pnpm quality:db` para revisar RLS/politicas de tablas publicas y politicas de buckets Storage desde migraciones.
- Implementado: reporte consolidado `pnpm quality:summary` con cobertura de rutas, memoria de auditoria, baselines visuales, Lighthouse y scripts de calidad.
- Implementado: reportes JSON de Playwright para E2E, a11y y visual, detectados por `pnpm quality:summary` como memoria de ultima ejecucion.
- Implementado: auditor `pnpm quality:prod` para readiness de entorno, secretos server-only, placeholders y configuracion Stripe/webhook sin imprimir valores sensibles.
- Implementado: whitelist explicita de checks server-only de readiness para que `pnpm quality:prod` no mezcle auditoria segura de secretos con exposicion accidental.
- Implementado: rate limit defensivo en endpoints publicos de reserva directa y checkout demo, con tests unitarios de ventana/limite/aislamiento.
- Implementado: cabeceras HTTP de seguridad en Next.js, con CSP report-only para validar integraciones antes de enforcement y auditoria en `pnpm quality:prod`.
- Implementado: errores API trazables con `error.requestId` y cabecera `X-Request-Id`, cubiertos con unit tests.
- Implementado: logging estructurado seguro para errores API 5xx, preparado para Vercel Runtime Logs/Drains sin registrar payloads sensibles.
- Implementado: `/api/health` con snapshot JSON de app, Supabase, base de datos, Stripe y metadata segura de runtime/deploy para monitorizacion futura.
- Implementado: CI inicial con typecheck, lint, unit tests, `pnpm quality:ci`, build web, Lighthouse CI no bloqueante y artefactos de reportes JSON/Lighthouse.
- Implementado: CI valida tambien `build:mobile` y export Expo web para detectar errores de bundling movil antes de publicar.
- Implementado: snapshots visuales estrictos de primer viewport para dashboard, reservas, calendario, distribucion y pagos en portatil 1366x768.
- Implementado: gate local `pnpm release:check` con reporte JSON para validar todo lo automatizable sin dispositivo fisico y listar checks manuales pendientes.
- Pendiente inmediato: ampliar snapshots estrictos al resto de modulos cuando sus campos dinamicos esten congelados y endurecer Lighthouse cuando haya baseline historico.

## Fase 2 - Operacion PMS

- Automatizaciones reales.
- Plantillas de mensajes.
- Check-in/check-out workflows.
- Documentos y evidencias.
- Owner portal.
- Owner statements.
- Pagos iniciales.
- Auditoria de eventos.

### Estado actual de Fase 2

- Implementado: modulo web de automatizaciones con alta, edicion, pausa/activacion, eliminacion, plantillas, trigger, canal, delay y API GET/POST/GET detail/PATCH/DELETE.
- Implementado: ejecucion manual segura de automatizaciones con `automation_runs`, preview renderizado, evento de auditoria y API `POST /api/automations/:ruleId/run`.
- Implementado: modulo web de workflows de check-in/check-out sobre `automation_rules`, con plantillas reutilizables por etapa, variables dinamicas, preview renderizado, alta, edicion, pausa/activacion, eliminacion y API GET/POST/GET detail/PATCH/DELETE.
- Implementado: motor compartido de plantillas en `@wiahost/shared` para resolver `{{guest_name}}`, `{{property_name}}`, fechas, access code, normas y telefono de soporte sin duplicar logica entre web/mobile/backend.
- Implementado: modulo web de auditoria operativa con timeline de eventos, alta manual, metadata, vinculacion a entidades y API GET/POST/GET detail/DELETE.
- Implementado: modulo web de documentos y evidencias con alta, edicion, eliminacion, vinculacion a propiedad/reserva/incidencia, API GET/POST/GET detail/PATCH/DELETE, subida real a Storage con URL firmada y descarga temporal segura.
- Implementado: modulo web de owner statements con alta, edicion, eliminacion, periodos, costes, payout neto y API GET/POST/GET detail/PATCH/DELETE.
- Implementado: modulo web de pagos iniciales con alta, edicion, eliminacion, estados, proveedor, importe, fecha de pago, enlaces tokenizados de checkout, Stripe Checkout opcional si hay claves, webhook firmado, confirmacion solo con `payment_status = paid` y API GET/POST/GET detail/PATCH/DELETE/checkout-link.
- Implementado: logica de decision del webhook Stripe extraida y cubierta con unit tests para eventos pagados, asincronos, sin referencia y no pagados.
- Implementado: centro de notificaciones `/notifications` con campana en topbar, contador de no leidas, marcado como leido y API GET/POST/PATCH.

## Fase 3 - Distribucion y canales

- Publicacion directa.
- Motor de reserva directa.
- Integraciones con canales mediante API cuando sea viable.
- Import/export iCal como paso intermedio si APIs no estan disponibles.
- Channel sync events.
- Control de disponibilidad y precios.

### Estado actual de Fase 3

- Implementado: modulo web de distribucion con publicaciones por canal sobre `property_listings`, alta, edicion, eliminacion, estado, URL, ID externo, slug de web directa, sync activo y API GET/POST/GET detail/PATCH/DELETE.
- Implementado: conectores de cuentas externas por canal sobre `channel_accounts`, con estado, modo auth sin secretos, scopes, health, notas y API GET/POST/GET detail/PATCH/DELETE.
- Implementado: registro de eventos de sincronizacion sobre `channel_sync_events`, con canal, direccion, estado, payload JSON, errores y API GET/POST.
- Implementado: motor publico de reserva directa `/book/[slug]`, conectado a `property_listings.public_slug`, con formulario de solicitud, creacion segura de guest, reservation en estado `inquiry`, conversation, mensaje inbound y evento de sync directo.
- Implementado: pipeline comercial `/leads` para revisar solicitudes directas, abrir el hilo de inbox, ver la reserva, preparar pago pendiente `direct_checkout`, generar checkout tokenizado y convertir/cancelar leads mediante Server Action/API.
- Implementado: export iCal publico `/api/ical/[slug]` para disponibilidad de anuncios publicados, sin exponer datos personales de huespedes.
- Implementado: import iCal basico `/api/ical/import` y formulario en `/distribution` para convertir VEVENT externos en bloqueos de calendario y registrar sync inbound.
- Implementado: normalizacion de mensajes entrantes `/api/channels/messages` y formulario en `/inbox` para convertir mensajes de Airbnb/Booking/Vrbo/email/WhatsApp en contacto, conversacion, mensaje inbound y evento de sync.
- Implementado: control inicial de precios `/pricing` sobre `pricing_observations`, con API GET/POST/GET detail/PATCH/DELETE para precio actual, sugerido, aprobado/final, ocupacion y conversion.
- Implementado: registro de sincronizacion outbound de precio desde `/pricing` mediante `channel_sync_events.payload.action = price_update` y API POST `/api/pricing/observations/[id]/sync`.
- Pendiente: probar Stripe en entorno real con claves de test, webhook firmado desde Stripe CLI/Dashboard, APIs oficiales por canal y sincronizacion automatica de precios con proveedores externos.

## Fase 4 - App movil

- Crear `apps/mobile` con Expo.
- Login Supabase.
- Dashboard mobile.
- Reservas, tareas, incidencias e inbox.
- Push notifications.
- EAS Build.
- Play Store internal testing.
- Publicacion Android.

### Estado actual de Fase 4

- Implementado: `apps/mobile` con Expo React Native, Expo Router, TypeScript strict y scripts integrados en Turborepo.
- Implementado: configuracion de Metro para monorepo, NativeWind preparado, package Android `com.globaltech.wiahost` y variables `EXPO_PUBLIC_*`.
- Implementado: Supabase Auth movil con persistencia de sesion en AsyncStorage, login, registro y perfil.
- Implementado: tabs moviles de Dashboard, Activos, Reservas, Inbox, Riesgo y Ajustes con UI nativa responsive.
- Implementado: fichas moviles navegables para activos, reservas, conversaciones e incidencias, con contexto operativo y fallback demo.
- Implementado: alta nativa de activos desde mobile con validacion compartida `propertySchema`, TanStack Query, Supabase insert y cache invalidation.
- Implementado: edicion nativa de activos desde mobile con formulario compartido, detalle real, validacion `propertySchema`, Supabase update e invalidacion de cache.
- Implementado: alta nativa de incidencias desde mobile con validacion compartida `incidentSchema`, seleccion de activo, severidad, coste estimado y Supabase insert.
- Implementado: envio de respuesta desde ficha de inbox mobile con validacion compartida `messageSchema`, insercion en `conversation_messages` y actualizacion de estado de conversacion.
- Implementado: alta nativa de reservas desde mobile con validacion compartida `manualReservationSchema`, creacion de huesped y reserva con calculo de noches/importes.
- Implementado: alta nativa de tareas desde mobile con validacion compartida `taskSchema`, seleccion de activo, tipo, prioridad y vencimiento.
- Implementado: cola prioritaria mobile navegable hacia inbox, tareas e incidencias.
- Implementado: ficha mobile de tarea con detalle, prioridad, vencimiento y cambio de estado.
- Implementado: historial completo de inbox mobile con mensajes ordenados y cambio de estado de conversacion.
- Implementado: cambio de estado mobile para reservas e incidencias con invalidacion de cache operativa.
- Implementado: configuracion inicial `apps/mobile/eas.json` para builds `development`, `preview` y `production` de Android.
- Implementado: subida de evidencias/fotos desde camara o galeria en fichas mobile de activos, incidencias y tareas, con Storage (`property-media`, `incident-attachments`, `reservation-documents`) y registro en `documents`.
- Implementado: selector mobile de PDF/documentos para evidencias y previsualizacion de adjuntos con miniatura de imagen, etiqueta PDF/DOC y apertura por URL firmada temporal.
- Implementado: registro mobile de push notifications desde Ajustes con `expo-notifications`, permisos nativos, canal Android `operations`, tabla `mobile_push_tokens` y RLS por usuario.
- Implementado: preparacion EAS Build con `eas-cli`, scripts raiz para login/configure/preview/production/submit, perfil preview APK, production AAB, perfiles iOS simulator/preview/production, bundle identifier iOS y guia `docs/EAS_BUILD.md`.
- Implementado: vinculacion del proyecto Expo/EAS con `extra.eas.projectId` no secreto, build preview Android real verificado en EAS y configuracion Metro endurecida para pnpm monorepo, evitando fallos de SHA en EAS Android y React duplicado en export web.
- Implementado: envio servidor de push notifications con API `POST /api/notifications/push`, validacion Zod, control de rol operador/admin, Expo Push Service, `EXPO_ACCESS_TOKEN` opcional y auditoria en `push_notification_deliveries`.
- Implementado: TanStack Query para cache/refresco de datos operativos y lectura directa de Supabase con RLS.
- Implementado: offline read-only basico en mobile para dashboard/listas principales con cache AsyncStorage, fallback a ultima operativa viva y banner visible.
- Implementado: offline read-only en fichas mobile de activo, reserva, conversacion, tarea e incidencia con cache AsyncStorage y banner visible cuando se muestra informacion guardada.
- Implementado: disparadores push automaticos y no bloqueantes desde operaciones web/API para mensajes entrantes, reservas relevantes, tareas prioritarias e incidencias, reutilizando `/api/notifications/push`, Expo Push Service y auditoria de entregas.
- Implementado: E2E mobile con Maestro separado en suite demo (`pnpm test:mobile:e2e`) y suite conectada (`pnpm test:mobile:e2e:connected`) para login, alta de activo e incidencia real con Supabase.
- Implementado: fallback demo para poder revisar la experiencia movil aunque no esten copiadas las variables.
- Implementado: typecheck movil limpio.
- Implementado: cache offline read-only para evidencias/documentos recientes en fichas mobile de activos, tareas e incidencias, con aviso visible cuando se muestran datos guardados.
- Implementado: Maestro demo valida que las fichas mobile exponen evidencias, y suite conectada anade flujos de cambio de estado real para incidencia, tarea y reserva.
- Implementado: cobertura Maestro conectada de readiness push en Ajustes, sin depender todavia de permisos del sistema operativo.
- Pendiente manual aparcado: instalar y validar el APK preview en dispositivo real, ampliar Maestro con subida de evidencia real y registro push con permisos controlados en dispositivo fisico. No bloquea el avance de web/backend/calidad.

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
- Gate de readiness de produccion con `pnpm quality:prod:production` antes de cada despliegue.

### Estado actual de Fase 6

- Implementado: gate local de release `pnpm release:check` para typecheck, lint, tests, auditorias, build web, build mobile y bundles Android/iOS.
- Implementado: reporte `quality/reports/release-check.json` con resultado de release y lista de pruebas manuales que requieren dispositivo fisico o cuentas externas.
- Implementado: documento canonico `docs/RELEASE.md` con APK demo, iOS/TestFlight, checks manuales pendientes y checklist antes de produccion SaaS.
- Implementado: workflow manual `Release Check` en GitHub Actions para ejecutar el gate de release y subir reportes JSON como artefacto.
- Implementado: documento canonico `docs/DEPLOYMENT.md` con flujo local/staging/production, Vercel, Supabase hosted, health check y promocion segura.
- Implementado: workflow manual `Web Deploy to Vercel` para preview/production con `pnpm release:check`, `vercel pull`, `vercel build` y deploy prebuilt.
- Implementado: auditor `pnpm quality:staging`, integrado en `pnpm quality:ci`, para validar deployment docs, workflow Vercel y variables/secrets documentadas.
- Implementado: smoke post-deploy `pnpm check:deployment -- --url <url>` conectado al workflow Vercel para validar `/api/health` y generar `deployment-health.json`.
- Implementado: preflight `pnpm accounts:check` para revisar Git remoto, Supabase CLI/login, Vercel CLI/login, EAS login, Stripe CLI opcional y `.env` locales sin imprimir secretos.
- Implementado: documento `docs/OBSERVABILITY.md` y auditor `pnpm quality:observability` integrado en `quality:ci`.
- Implementado: runbook `docs/INCIDENT_RESPONSE.md` para severidades, diagnostico, rollback, comunicacion y cierre de incidentes.
- Implementado: proyecto Vercel real `wiahost` enlazado, Root Directory `apps/web`, Node.js `22.x`, `.vercelignore` de monorepo y preview web desplegado.
- Implementado: smoke test real de preview con `pnpm check:deployment` contra `https://wiahost-fqdqh89js-globaltechsmartsolutions-projects.vercel.app`.
- Implementado: verificacion visual rapida de preview publico con Playwright: status 200, titulo/H1 correctos y sin errores de consola.
- Implementado: plantilla `.env.staging.example`, script `pnpm staging:supabase` para link/dry-run/apply de migraciones Supabase hosted y script `pnpm vercel:env:sync` para sincronizar variables en Vercel sin imprimir secretos.
- Pendiente: crear organizacion/proyecto Supabase hosted visible para el token actual (`supabase orgs list` devuelve `[]`), configurar variables runtime reales en Vercel, configurar secretos `VERCEL_*` en GitHub Actions, backups Supabase hosted, observabilidad externa y cuentas de stores.
