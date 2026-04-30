# Arquitectura

## Resumen

WIAHost esta planteado como monorepo para soportar web, app movil, backend Supabase y paquetes compartidos.

```text
wiahost/
  apps/
    web/
    mobile/
  packages/
    shared/
    database/
  supabase/
    migrations/
    seed.sql
  docs/
```

## Apps

### `apps/web`

Aplicacion principal web con Next.js App Router.

Responsabilidades:

- Landing publica.
- Dashboard PMS.
- Panel de operaciones.
- Formularios de auth y propiedades.
- Route handlers para health, properties, reservas, tareas, incidencias e inbox.
- Integracion progresiva con Supabase.

### `apps/mobile`

App movil real con Expo React Native y Expo Router.

No es WebView. Usa Supabase Auth, Supabase Postgres con RLS, TanStack Query y paquetes compartidos de validacion/tipos.

Responsabilidades actuales:

- Login y registro nativos.
- Dashboard operativo movil.
- Tabs de activos, reservas, inbox, riesgo y ajustes.
- Queries directas contra Supabase con fallback demo.
- Preparacion para Play Store mediante `com.globaltech.wiahost`.

## Packages

### `packages/shared`

Contiene roles, constantes, tipos compartidos y validadores Zod.

### `packages/database`

Contiene `database.types.ts` generado desde Supabase y tipos derivados futuros.

## Supabase

Supabase actua como backend comun: Auth, Postgres, RLS, Realtime futuro, Storage y Edge Functions futuras.

Piezas preparadas:

- Migraciones SQL.
- RLS inicial.
- Storage buckets.
- Seed demo.
- Auth inicial.
- Tablas AI-ready para eventos, labels, predicciones y auditoria.

## Estado actual de conexion

La UI combina datos demo con primeras integraciones reales:

- Login/register usan Supabase Auth.
- Properties tiene lectura, creacion, detalle, edicion y archivo controlado con Supabase.
- Dashboard, reservas, calendario, inbox, tareas e incidencias leen de Supabase con fallback demo.
- Reservas, tareas e incidencias tienen creacion, detalle, edicion completa y actualizacion de estado mediante Server Actions y Route Handlers compartiendo servicios de mutacion.
- Reservas, tareas, incidencias e inbox tienen filtros GET server-side sobre los datos cargados para proteger deep links y futura app movil.
- Tareas sincronizan `task_outcomes` desde los servicios de mutacion para medir SLA y alimentar reporting/IA futura sin depender solo de la vista.
- Owners lee owner accounts, propiedades, reservas e incidencias desde Supabase con fallback demo.
- Settings lee el perfil autenticado desde Supabase y permite actualizar nombre/telefono mediante Server Action.
- Settings muestra readiness tecnico de URL publica, Supabase, service role, base de datos y Stripe sin exponer secretos. El mismo snapshot alimenta `/api/health`.
- Search centraliza busqueda protegida en `/search` y reutiliza queries Supabase/fallback demo para localizar reservas, huespedes, propiedades, tareas, incidencias y conversaciones desde la topbar.
- Guests lee huespedes, reservas y conversaciones desde Supabase; permite alta, ficha, edicion mediante Server Actions y API GET/POST/GET detail/PATCH.
- Calendar reutiliza la matriz operativa real del dashboard, filtra propiedades archivadas y permite crear, editar y eliminar bloqueos manuales mediante Server Actions/API.
- Automations gestiona reglas PMS con trigger, canal, plantilla, delay y estado mediante Server Actions y API REST preparada para mobile. Tambien permite ejecutar pruebas manuales que crean `automation_runs` y eventos de auditoria sin enviar mensajes reales.
- Workflows de check-in/check-out es una capa de producto sobre `automation_rules`: filtra los triggers de ciclo de vida del huesped, expone plantillas reutilizables y mantiene API REST preparada para mobile sin duplicar modelo de datos. Las plantillas usan el renderer compartido de `@wiahost/shared` para preview con datos demo y deteccion de variables pendientes.
- Audit registra y muestra eventos operativos sobre propiedades, reservas, tareas e incidencias usando la tabla `operational_events` preparada para trazabilidad e IA futura.
- Documents gestiona evidencias y storage vinculados a propiedades, reservas e incidencias mediante Server Actions y API REST preparada para mobile. La web pide una URL firmada temporal, sube el archivo a Supabase Storage desde el navegador y despues registra el metadata, manteniendo buckets privados y sin exponer service role.
- Statements gestiona liquidaciones de propietario con ingresos, costes, fees, periodo, estado y API REST preparada para mobile.
- Payments gestiona pagos manuales vinculados a reservas con estado, proveedor, importe, fecha y enlace de checkout tokenizado mediante Server Actions y API REST preparada para mobile. Si `STRIPE_SECRET_KEY` esta configurada, el enlace usa Stripe Checkout; si no, cae a checkout demo local para desarrollo.
- Notifications activa la campana del shell y la ruta `/notifications` sobre la tabla `notifications`, con API REST para crear avisos internos y marcar leidos. `POST /api/notifications/push` permite a operadores/admins enviar avisos al movil usando tokens de `mobile_push_tokens`, Expo Push Service y auditoria en `push_notification_deliveries`.
- Distribution gestiona publicaciones por canal con `property_listings` y registra sincronizaciones con `channel_sync_events`. Es la base para publicar anuncios, motor de reserva directa, import/export iCal y mensajes entrantes por canal.
- `channel_accounts` registra la preparacion operativa de cuentas externas por canal sin almacenar secretos: modo de integracion, estado, scopes, salud y notas. Las credenciales reales deben vivir en variables seguras o vault del proveedor, no en base de datos de producto.
- Direct booking expone `/book/[slug]` como pagina publica. Lee anuncios publicados con service role en servidor, crea solicitudes como `reservations.status = inquiry`, abre conversacion inbound y registra evento de canal directo sin exponer secretos al cliente.
- Leads centraliza solicitudes directas en `/leads`, reutilizando `reservations`, `guests`, `properties` y `conversations`. El paso "preparar pago" crea un `payments` pendiente con proveedor `direct_checkout`, genera enlace `/checkout/[paymentId]` con token o Stripe Checkout, cambia consultas a `pending` y registra `channel_sync_events`.
- Stripe queda aislado en `apps/web/src/lib/stripe/server.ts` con cliente lazy para no romper builds sin secretos. El webhook `POST /api/stripe/webhook` verifica `Stripe-Signature` con `STRIPE_WEBHOOK_SECRET` y solo marca pagos como `paid` cuando Stripe informa `payment_status = paid`, incluyendo pagos diferidos mediante `checkout.session.async_payment_succeeded`.
- Readiness de produccion se audita con `pnpm quality:prod`: revisa ejemplos de entorno, `.env.local`, exposicion de claves server-only y pares Stripe/webhook sin imprimir valores sensibles.
- `/api/health` expone un snapshot JSON de readiness para monitores externos: estado global, checks y estado de base de datos. Devuelve 503 solo si una comprobacion critica falla.
- iCal export expone `/api/ical/[slug]` para anuncios publicados. Genera un calendario `text/calendar` con reservas/bloqueos de la propiedad y oculta datos personales, sirviendo como puente hasta integrar APIs oficiales.
- iCal import recibe calendarios externos en `/api/ical/import` o desde `/distribution`, parsea `VEVENT`, crea `calendar_blocks` no duplicados y registra `channel_sync_events` inbound para auditoria.
- Inbound channel messages entran por `/api/channels/messages` o desde `/inbox`: se normalizan en `guests`, `conversations`, `conversation_messages` y `channel_sync_events` para que futuros webhooks de portales acaben en la misma bandeja operativa.
- Inbox prioriza conversaciones con reglas explicables compartidas en `@wiahost/shared`: SLA, check-in cercano y palabras operativas/acceso. No toma decisiones automaticas; solo ordena la atencion y muestra motivo.
- Conversaciones de inbox tienen endpoint `PATCH /api/inbox/:conversationId` y Server Action para actualizar estado (`open`, `pending_team`, `pending_guest`, `resolved`, `archived`) sin duplicar logica.
- Respuestas y cambios de estado de inbox registran `operational_events` no bloqueantes para trazabilidad, soporte y datasets futuros.
- Reservas, tareas, incidencias y leads directos tambien registran `operational_events` no bloqueantes al crearse, editarse o cambiar de estado, manteniendo actor, entidad, propiedad/reserva y metadata minima para auditoria.
- `/audit` permite filtrar la memoria operativa por busqueda libre, fuente y entidad para que soporte y operaciones puedan investigar una reserva, tarea o incidencia sin revisar todo el timeline.
- `/audit/:eventId` muestra contexto, actor, referencias tecnicas y metadata JSON del evento para depurar flujos y revisar payloads sin acceder directamente a base de datos.
- El detalle de inbox permite guardar etiquetas humanas en `message_labels`; esta memoria revisada por personas alimentara reglas, evals y modelos futuros sin automatizar decisiones sensibles.
- Pricing conecta `/pricing` y `/api/pricing/observations` con `pricing_observations`. Permite guardar recomendaciones manuales o importadas por canal y registrar un `price_update` outbound en `channel_sync_events` antes de conectar PriceLabs, Beyond, Wheelhouse o motores propios.

La prioridad tecnica actual es completar acciones moviles sobre los modulos ya conectados en web manteniendo RLS, validadores compartidos y tests.
