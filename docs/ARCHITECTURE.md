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
- Calendar reutiliza la matriz operativa real del dashboard, filtra propiedades archivadas y permite crear bloqueos manuales mediante Server Action/API.

La prioridad tecnica actual es conectar cada pantalla PMS a Supabase manteniendo RLS, validadores compartidos y tests.
