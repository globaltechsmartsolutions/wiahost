# WIAHost

WIAHost es una plataforma PMS/CRM para gestionar alojamientos turisticos y operaciones tipo Hostaway, Guesty o Lodgify.

El objetivo es centralizar propiedades, reservas, calendario multi-canal, mensajes, tareas, incidencias, automatizaciones, pagos y propietarios en un unico centro de mando preparado para web, movil y backend compartido.

## Estado actual

- Monorepo con pnpm workspaces y Turborepo.
- Web app con Next.js App Router en `apps/web`.
- UI profesional tipo hospitality command center.
- Dashboard navegable con datos demo.
- Rutas web iniciales: landing, dashboard, properties, reservations, calendar, guests, inbox, tasks, incidents, owners, settings, login y register.
- Supabase preparado con migraciones SQL, RLS, storage, seed demo y base de datos preparada para IA futura.
- Supabase Auth inicial implementado para login/register y acciones de propiedades.
- Paquetes compartidos para tipos y validaciones en `packages/shared`.
- Paquete de tipos de base de datos en `packages/database`.

Importante: varias pantallas siguen usando datos demo para validar producto y diseno. La fase actual es conectar progresivamente dashboard, reservas, inbox, tareas e incidencias a Supabase.

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
cp .env.example apps/web/.env.local
pnpm dev:web
```

Para usar el puerto 3002:

```bash
pnpm --filter web exec next dev --port 3002
```

## Supabase local

Cuando tengas Supabase CLI instalado:

```bash
supabase start
pnpm db:reset
pnpm db:types
```

El seed crea usuarios y datos demo para operaciones PMS.

## Scripts principales

```bash
pnpm dev:web
pnpm build:web
pnpm typecheck
pnpm lint
pnpm test
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

## Siguiente paso recomendado

Completar la conexion real de las pantallas PMS a Supabase, empezando por propiedades, reservas, inbox, tareas e incidencias.
