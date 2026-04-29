# WIAHost

WIAHost es una plataforma PMS/CRM para gestionar alojamientos turisticos y operaciones tipo Hostaway, Guesty o Lodgify.

El objetivo es centralizar propiedades, reservas, calendario multi-canal, mensajes, tareas, incidencias, automatizaciones, pagos y propietarios en un unico centro de mando preparado para web, movil y backend compartido.

## Estado actual

- Monorepo con pnpm workspaces y Turborepo.
- Web app con Next.js App Router en `apps/web`.
- UI profesional tipo hospitality command center.
- Dashboard navegable con datos Supabase y fallback demo.
- Rutas web actuales: landing, dashboard, properties, reservations, calendar, guests, inbox, leads, notifications, tasks, incidents, owners, statements, payments, pricing, distribution, documents, audit, workflows, automations, settings, login y register.
- Supabase preparado con migraciones SQL, RLS, storage, seed demo y base de datos preparada para IA futura.
- Supabase Auth implementado y verificado con usuarios demo locales.
- Propiedades tienen lectura, detalle, creacion, edicion, API y archivo controlado contra Supabase local.
- Reservas, tareas, incidencias e inbox tienen lectura, detalle, API y escrituras reales verificadas contra Supabase local.
- Rutas protegidas con `proxy.ts` de Next.js 16 y suite Playwright E2E inicial para smoke, login, reservas, tareas, incidencias e inbox.
- Auditoria de accesibilidad con axe, baseline visual inicial, Lighthouse CI y memoria versionada en `quality/audit-memory`.
- Paquetes compartidos para tipos y validaciones en `packages/shared`.
- Paquete de tipos de base de datos en `packages/database`.

Importante: la web mantiene fallback demo para poder navegar sin entorno local, pero con `.env.local` configurado trabaja contra Supabase.

## Stack

- Monorepo: pnpm workspaces + Turborepo.
- Web: Next.js, React, TypeScript strict.
- UI web: Tailwind CSS + shadcn/ui + lucide-react.
- Backend: Supabase.
- Base de datos: Supabase Postgres.
- Auth: Supabase Auth.
- Seguridad: Supabase Row Level Security.
- Storage: Supabase Storage.
- Validacion: Zod.
- Formularios futuros: React Hook Form + Zod resolver.
- Testing preparado: Vitest y Playwright.
- Deploy web futuro: Vercel.
- Mobile futuro: Expo React Native + EAS Build para Play Store/App Store.

## Instalacion local

```bash
git clone https://github.com/globaltechsmartsolutions/wiahost.git
cd wiahost
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm supabase:start
pnpm db:reset
pnpm db:types
pnpm --filter web exec next dev --port 3002
```

Para usar el puerto 3002:

```bash
pnpm --filter web exec next dev --port 3002
```

## Supabase local

La CLI de Supabase esta instalada como devDependency del repo:

```bash
pnpm supabase:start
pnpm db:reset
pnpm db:types
```

El seed crea usuarios y datos demo para operaciones PMS:

- `operaciones@wiahost.local` / `Password123!`
- `admin@wiahost.local` / `Password123!`
- `owner@wiahost.local` / `Password123!`
- `limpieza@wiahost.local` / `Password123!`

## Scripts principales

```bash
pnpm dev:web
pnpm build:web
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
pnpm quality:routes
pnpm quality:summary
pnpm audit:web
pnpm audit:lighthouse
pnpm supabase:start
pnpm db:reset
pnpm db:types
```

## Documentacion

Empieza por `docs/README.md`.

Documentos principales:

- Producto: `docs/PRODUCT.md`
- Arquitectura: `docs/ARCHITECTURE.md`
- Base de datos: `docs/DATABASE.md`
- IA: `docs/AI.md`
- Roadmap: `docs/ROADMAP.md`
- Setup local: `docs/SETUP.md`
- Calidad: `docs/QUALITY_AND_AUDIT_STRATEGY.md`

## Regla visual importante

El dashboard no debe tener huecos muertos entre modulos. Si dos cards comparten fila en desktop, sus bordes superiores e inferiores deben quedar alineados. Los gutters deben caer en la misma rejilla aunque cambie el numero de cards. Esta regla vive en `quality/audit-memory/product-rules.md` y se valida parcialmente con Playwright visual.

## Siguiente paso recomendado

Seguir con checkout online real, conectores oficiales de canales y endurecimiento progresivo de Lighthouse cuando tengamos historico estable.
