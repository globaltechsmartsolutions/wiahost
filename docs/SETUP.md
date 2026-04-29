# Setup local

## Web

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm --filter web exec next dev --port 3002
```

Puerto alternativo:

```bash
pnpm --filter web exec next dev --port 3002
```

## Supabase

La CLI de Supabase queda instalada como devDependency del monorepo, asi que no hace falta instalarla globalmente. Comprobar:

```bash
pnpm exec supabase --version
```

Arrancar backend local:

```bash
pnpm supabase:start
pnpm db:reset
pnpm db:types
```

URLs locales verificadas:

- Web: `http://localhost:3002`
- Supabase Studio: `http://127.0.0.1:54323`
- Supabase API: `http://127.0.0.1:54321`
- Database: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Usuarios demo tras `pnpm db:reset`:

- `admin@wiahost.local` / `Password123!`
- `operaciones@wiahost.local` / `Password123!`
- `owner@wiahost.local` / `Password123!`
- `limpieza@wiahost.local` / `Password123!`

## Calidad

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
pnpm quality:routes
pnpm audit:web
pnpm audit:lighthouse
pnpm build:web
```

`pnpm test:e2e` necesita Supabase local arrancado, `apps/web/.env.local` configurado y usuarios demo creados con `pnpm db:reset`.
`pnpm quality:routes` cruza el inventario versionado de rutas con las suites visuales y de accesibilidad para detectar pantallas nuevas sin cobertura.
`pnpm test:visual -- --update-snapshots` actualiza capturas base cuando un cambio visual ha sido revisado y aceptado.
`pnpm audit:lighthouse` construye la web, arranca `next start` en el puerto `3010`, usa un perfil Chrome temporal controlado para evitar bloqueos de Windows y guarda reportes locales en `quality/reports/lighthouse`.

## Estado conocido

En esta fase la web ya funciona contra Supabase local si `.env.local` tiene las claves generadas por `pnpm supabase:start`:

- Login/register usan Supabase Auth.
- Dashboard, reservas, inbox, tareas, incidencias, properties, calendar, guests, owners y settings quedan protegidas por `proxy.ts`.
- Properties tiene lectura, detalle, creacion, edicion y archivo controlado contra Supabase.
- Dashboard, reservas, inbox, tareas e incidencias leen de Supabase con fallback demo si no hay entorno configurado.
- Reservas manuales, tareas, incidencias y respuestas de inbox tienen escrituras reales verificadas contra Supabase local.
- Playwright valida smoke publico/auth y flujos reales de propiedades, reservas, tareas, incidencias e inbox contra Supabase local.
- Axe valida rutas publicas y protegidas, incluyendo detalle/edicion de propiedades, sin violaciones WCAG criticas/serias.
- Playwright visual valida landing/auth y comprueba que el dashboard no tenga overflow ni huecos por desalineacion entre calendario y cola prioritaria.
- Lighthouse CI valida landing/login/register con budgets iniciales de performance, accesibilidad, best practices y SEO.

Si otro proyecto local ocupa `54321/54322`, paralo antes de arrancar WIAHost. Ejemplo:

```bash
pnpm exec supabase stop --project-id inquilinapp
```
