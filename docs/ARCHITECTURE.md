# Arquitectura

## Resumen

WIAHost esta planteado como monorepo para soportar web, app movil futura, backend Supabase y paquetes compartidos.

```text
wiahost/
  apps/
    web/
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

### `apps/mobile` futuro

App movil real con Expo React Native.

No sera WebView. Usara Supabase Auth, Supabase Postgres con RLS y paquetes compartidos de validacion/tipos.

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
- Owners lee owner accounts, propiedades, reservas e incidencias desde Supabase con fallback demo.
- Settings lee el perfil autenticado desde Supabase y permite actualizar nombre/telefono mediante Server Action.
- Guests lee huespedes, reservas y conversaciones desde Supabase; permite alta, ficha, edicion mediante Server Actions y API GET/POST/GET detail/PATCH.
- Calendar reutiliza la matriz operativa real del dashboard, filtra propiedades archivadas y permite crear, editar y eliminar bloqueos manuales mediante Server Actions/API.
- Automations gestiona reglas PMS con trigger, canal, plantilla, delay y estado mediante Server Actions y API REST preparada para mobile.
- Workflows de check-in/check-out es una capa de producto sobre `automation_rules`: filtra los triggers de ciclo de vida del huesped, expone plantillas reutilizables y mantiene API REST preparada para mobile sin duplicar modelo de datos.
- Audit registra y muestra eventos operativos sobre propiedades, reservas, tareas e incidencias usando la tabla `operational_events` preparada para trazabilidad e IA futura.
- Documents gestiona evidencias y referencias de storage vinculadas a propiedades, reservas e incidencias mediante Server Actions y API REST preparada para mobile.
- Statements gestiona liquidaciones de propietario con ingresos, costes, fees, periodo, estado y API REST preparada para mobile.
- Payments gestiona pagos manuales vinculados a reservas con estado, proveedor, importe, fecha y enlace de checkout tokenizado mediante Server Actions y API REST preparada para mobile.
- Notifications activa la campana del shell y la ruta `/notifications` sobre la tabla `notifications`, con API REST para crear avisos internos y marcar leidos.
- Distribution gestiona publicaciones por canal con `property_listings` y registra sincronizaciones con `channel_sync_events`. Es la base para publicar anuncios, motor de reserva directa, import/export iCal y mensajes entrantes por canal.
- Direct booking expone `/book/[slug]` como pagina publica. Lee anuncios publicados con service role en servidor, crea solicitudes como `reservations.status = inquiry`, abre conversacion inbound y registra evento de canal directo sin exponer secretos al cliente.
- Leads centraliza solicitudes directas en `/leads`, reutilizando `reservations`, `guests`, `properties` y `conversations`. El paso "preparar pago" crea un `payments` pendiente con proveedor `direct_checkout`, genera enlace `/checkout/[paymentId]` con token, cambia consultas a `pending` y registra `channel_sync_events` para dejar trazabilidad antes de Stripe real.
- iCal export expone `/api/ical/[slug]` para anuncios publicados. Genera un calendario `text/calendar` con reservas/bloqueos de la propiedad y oculta datos personales, sirviendo como puente hasta integrar APIs oficiales.
- iCal import recibe calendarios externos en `/api/ical/import` o desde `/distribution`, parsea `VEVENT`, crea `calendar_blocks` no duplicados y registra `channel_sync_events` inbound para auditoria.
- Inbound channel messages entran por `/api/channels/messages` o desde `/inbox`: se normalizan en `guests`, `conversations`, `conversation_messages` y `channel_sync_events` para que futuros webhooks de portales acaben en la misma bandeja operativa.
- Pricing conecta `/pricing` y `/api/pricing/observations` con `pricing_observations`. Permite guardar recomendaciones manuales o importadas por canal y registrar un `price_update` outbound en `channel_sync_events` antes de conectar PriceLabs, Beyond, Wheelhouse o motores propios.

La prioridad tecnica actual es conectar cada pantalla PMS a Supabase manteniendo RLS, validadores compartidos y tests.
