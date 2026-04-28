# WIAHost

WIAHost es una plataforma PMS/CRM para gestionar alojamientos turisticos y operaciones tipo Hostaway, Guesty o Lodgify.

El objetivo es centralizar propiedades, reservas, calendario multi-canal, mensajes, tareas, incidencias, automatizaciones, pagos y propietarios en un unico centro de mando preparado para web, movil y backend compartido.

## Estado actual

- Monorepo con pnpm workspaces y Turborepo.
- Web app con Next.js App Router en `apps/web`.
- UI profesional tipo hospitality command center.
- Dashboard navegable con datos demo.
- Rutas web iniciales: landing, dashboard, properties, reservations, calendar, guests, inbox, tasks, incidents, owners, settings, login y register.
- Supabase preparado con migraciones SQL, RLS, storage y seed demo.
- Paquetes compartidos para tipos y validaciones en `packages/shared`.
- Paquete de tipos de base de datos en `packages/database`.

Importante: la interfaz actual usa datos demo para validar producto y diseno. La siguiente fase es conectar las pantallas a Supabase Auth y Supabase Postgres.

## Stack

- Monorepo: pnpm workspaces + Turborepo.
- Web: Next.js, React, TypeScript strict.
- UI web: Tailwind CSS + shadcn/ui + lucide-react.
- Backend: Supabase.
- Base de datos: Supabase Postgres.
- Auth futura: Supabase Auth.
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

- Producto: `docs/PRODUCT.md`
- Arquitectura: `docs/ARCHITECTURE.md`
- Base de datos: `docs/DATABASE.md`
- Mobile y Play Store: `docs/MOBILE_AND_PLAYSTORE.md`
- Roadmap: `docs/ROADMAP.md`
- Setup local: `docs/SETUP.md`
- Investigacion UI: `docs/UI_RESEARCH.md`
- Calidad y auditoria inteligente: `docs/QUALITY_AND_AUDIT_STRATEGY.md`
- Oportunidades de Machine Learning: `docs/ML_OPPORTUNITIES_FROM_NOTES.md`
- Oportunidades de redes neuronales/RNN: `docs/NEURAL_NETWORKS_OPPORTUNITIES_FROM_NOTES.md`
- Revision completa del Modulo 3 de IA: `docs/AI_MODULE_3_FULL_REVIEW.md`

## Siguiente paso recomendado

Completar CRUD de propiedades y montar la suite robusta de Playwright, visual regression, accesibilidad y Lighthouse CI definida en `docs/QUALITY_AND_AUDIT_STRATEGY.md`.
