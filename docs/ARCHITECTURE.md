# Arquitectura

## Resumen

WIAHost esta planteado como monorepo para soportar web, app movil y paquetes compartidos.

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
- Formularios futuros.
- Route handlers futuros para API compatible con mobile/integraciones.

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

## Estado actual de conexion

La UI usa datos demo desde `apps/web/src/lib/demo-data.ts`.

La base Supabase esta preparada, pero las pantallas aun no leen ni escriben datos reales.
