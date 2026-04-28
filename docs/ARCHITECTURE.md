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
- Route handlers iniciales para health y properties.
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
- Properties tiene lectura/creacion inicial con Supabase.
- Dashboard, reservas, calendario, inbox, tareas, incidencias, owners y settings siguen siendo principalmente demo.

La prioridad tecnica actual es conectar cada pantalla PMS a Supabase manteniendo RLS, validadores compartidos y tests.
