# Deployment y staging

## Objetivo

Dejar WIAHost preparado para tener una URL online de pruebas antes de produccion. El flujo recomendado es:

```text
local -> staging -> production
```

- `local`: desarrollo en tu ordenador.
- `staging`: entorno online para demos y pruebas internas.
- `production`: entorno real de clientes.

## Estrategia recomendada

### Staging

- Vercel preview deployment para la web.
- Supabase hosted separado para staging.
- Stripe en modo test.
- Storage real de Supabase con buckets privados.
- Datos demo controlados, nunca datos reales sensibles.
- Health check activo en `/api/health`.

### Production

- Vercel production deployment.
- Supabase hosted separado de staging.
- Backups activados en Supabase.
- Stripe live solo cuando el flujo test este validado.
- Dominio final, politica de privacidad y terminos.
- Observabilidad externa y alertas.

## Supabase hosted staging

1. Crear un proyecto Supabase nuevo para staging.
2. Guardar estas claves fuera del repo:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

3. Vincular el proyecto localmente cuando toque aplicar migraciones:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <staging-project-ref>
pnpm exec supabase db push
pnpm db:types
```

4. Revisar en Supabase Studio:

- tablas creadas;
- RLS activo;
- policies;
- buckets;
- usuarios demo si se crean para staging.

5. No ejecutar seeds destructivos sobre produccion. Staging puede tener seed demo, produccion no.

## Vercel staging

Estado actual:

- Proyecto Vercel `wiahost` creado en la cuenta `globaltechsmartsolutions`.
- Root Directory configurado en `apps/web`.
- Node.js configurado en `22.x`, alineado con GitHub Actions.
- Deployment protection SSO desactivado para que las demos internas y `/api/health` sean accesibles.
- Preview conectado a Supabase hosted verificado: `https://wiahost-staging.vercel.app`.
- Production deployment automatico desde GitHub validado: `https://wiahost-bvwmr29o8-globaltechsmartsolutions-projects.vercel.app`.
- Workflow manual `Web Deploy to Vercel` configurado con secretos GitHub `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`, scope de equipo `globaltechsmartsolutions-projects` y deploy prebuilt validado.
- Health check verificado con `pnpm check:deployment`.
- `.vercelignore` reduce el upload del monorepo y mantiene fuera mobile, reports, artefactos, `.env` y migraciones raiz.

Staging conectado actual:

- Proyecto Supabase hosted `ywrmzhudqmmgnjeymkuf`.
- Migraciones aplicadas en Supabase hosted.
- Tipos de base de datos regenerados desde el proyecto linked.
- Seed demo idempotente aplicado y verificado con login de operaciones.
- Variables Supabase usadas en deployment preview sin imprimir valores.

Pendiente actual para endurecer staging/production:

- Ejecutar `pnpm vercel:deploy:env -- --file .env.staging.local --target preview` cuando se quiera crear un nuevo preview con variables locales sin depender de Git integration.
- Configurar en Vercel/GitHub las variables runtime reales de Stripe test, Resend y Expo server-side cuando se activen.
- Automatizar backups de Supabase hosted y monitorizacion externa cuando haya produccion real.
- Repetir `pnpm check:deployment -- --url <preview-url>` tras cada preview manual o cambio sensible.

Hay dos caminos validos.

### Opcion A: Git integration

Crear un proyecto Vercel conectado al repo y configurarlo como monorepo:

- Framework: Next.js.
- Root Directory: `apps/web`.
- Install Command: `pnpm install --frozen-lockfile`.
- Build Command: `pnpm build`.
- Output: automatico de Next.js.

Vercel soporta monorepos con workspaces. El proyecto remoto debe mantener `Root Directory = apps/web`; el repositorio local puede estar enlazado desde la raiz con `.vercel/project.json` ignorado por Git.

En Windows, `vercel build` local puede fallar por permisos de symlink (`EPERM`) al generar el output prebuilt. No es un fallo de la app: en Linux/GitHub Actions o con deploy remoto de Vercel el build pasa correctamente.

### Opcion B: GitHub Actions con deploy prebuilt

El workflow manual esta en:

```text
.github/workflows/vercel-web-deploy.yml
```

Usa:

- `pnpm release:check`;
- `vercel pull`;
- `vercel build`;
- `vercel deploy --prebuilt`.
- `node scripts/check-deployment-health.mjs` contra la URL desplegada.

El workflow debe ejecutarse desde la raiz del monorepo, no desde `apps/web`, porque el proyecto remoto de Vercel ya tiene `Root Directory = apps/web`. Si se ejecuta desde `apps/web`, Vercel intentara resolver `apps/web/apps/web/package.json`.

El scope del equipo queda fijado en el workflow como `globaltechsmartsolutions-projects` para que los comandos `vercel pull/build/deploy` no dependan del contexto interactivo del runner.

Secretos necesarios en GitHub:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Variables runtime necesarias en Vercel:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
EXPO_ACCESS_TOKEN
RESEND_API_KEY
```

`EXPO_ACCESS_TOKEN`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` son opcionales hasta activar esas integraciones, pero deben quedar como server-only cuando se usen.

Sincronizacion segura desde archivo local:

```bash
cp .env.staging.example .env.staging.local
pnpm staging:supabase
pnpm staging:supabase -- --apply
pnpm staging:seed
pnpm staging:seed -- --apply
pnpm staging:rotate-db-password
pnpm staging:rotate-db-password -- --apply
pnpm staging:backup
pnpm staging:backup -- --apply
pnpm vercel:env:sync -- --file .env.staging.local --environment preview
pnpm vercel:deploy:env -- --file .env.staging.local --target preview
```

`staging:supabase` enlaza Supabase hosted, primero en dry-run y despues con `--apply` para aplicar migraciones. `staging:seed` hace dry-run del seed demo y con `--apply` aplica `supabase/seed.sql`, verifica usuarios Auth, datos minimos y login demo sin imprimir secretos. `staging:rotate-db-password` genera una contrasena nueva para el rol Postgres, actualiza `.env.staging.local`, verifica el nuevo valor con un dry-run de seed y deja un reporte local sin secretos. `staging:backup` crea un dump local ignorado por Git en `supabase/backups`. `vercel:env:sync` configura variables persistentes en el proyecto Vercel. Si el proyecto Vercel aun no tiene Git repo conectado, `preview` puede exigir rama y fallar; en ese caso usar `vercel:deploy:env`, que crea un deployment con variables de build/runtime desde `.env.staging.local` sin imprimir valores. Estos scripts ignoran claves locales como `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` y `SUPABASE_DB_PASSWORD`, y fallan si detectan placeholders.

`staging:rotate-db-password -- --apply` requiere `SUPABASE_ACCESS_TOKEN` solo en la variable de entorno de la terminal. No guardarlo en Git ni en archivos compartidos.

Si un token personal de Supabase se pega por error en un chat, revocarlo manualmente en la cuenta de Supabase y hacer login de nuevo en la CLI:

```bash
pnpm exec supabase logout
pnpm exec supabase login
```

Usuarios demo de staging:

```text
operaciones@wiahost.local / Password123!
admin@wiahost.local / Password123!
owner@wiahost.local / Password123!
limpieza@wiahost.local / Password123!
```

La URL preview conectada y validada con login demo es:

```text
https://wiahost-staging.vercel.app
```

El alias estable apunta al ultimo preview validado. Si se genera un preview nuevo con `pnpm vercel:deploy:env`, reasignar el alias:

```bash
pnpm dlx vercel@52.2.1 alias set <deployment>.vercel.app wiahost-staging.vercel.app
```

El ultimo workflow manual prebuilt validado genero un preview saludable y paso `Check preview health`. Para nuevas demos, usar preferiblemente el alias estable salvo que se quiera revisar una URL preview concreta del run.

## Checklist antes de crear staging

```bash
pnpm install
pnpm accounts:check
pnpm quality:staging
pnpm release:check
pnpm quality:prod:production
```

`accounts:check` revisa sin imprimir secretos el remoto Git, Supabase CLI/login, Vercel CLI/login si existe, EAS login, Stripe CLI opcional y archivos `.env` locales. Genera `quality/reports/external-accounts.json`.

`quality:staging` comprueba que este documento, el workflow manual de Vercel, los scripts de release y las variables de entorno documentadas siguen presentes antes de tocar cuentas reales.

`quality:prod:production` exige URLs `https` y bloquea configuraciones de produccion inseguras. En local puede fallar si no exportas variables reales de staging/production en la terminal; eso es correcto.

## Smoke test de staging

Cuando exista URL:

```bash
pnpm check:deployment -- --url https://staging.wiahost.com
```

Tambien se puede comprobar manualmente con `curl https://staging.wiahost.com/api/health`. Debe devolver:

- `status: "ok"` o `degraded` si falta una integracion opcional;
- `runtime.environment`;
- `runtime.provider`;
- `runtime.commit`;
- checks sin valores secretos.

El script genera `quality/reports/deployment-health.json`, falla si `/api/health` devuelve errores y no imprime secretos.

Luego validar manualmente:

- `/`
- `/login`
- `/dashboard`
- `/reservations`
- `/calendar`
- `/inbox`
- `/tasks`
- `/incidents`
- `/distribution`
- `/payments`
- `/settings`

## Stripe test

Antes de activar pagos live:

1. Configurar en staging `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` de modo test.
2. Generar un link desde `/payments` o desde `/leads`.
3. Completar una Checkout Session con tarjeta test de Stripe.
4. Verificar que `POST /api/stripe/webhook` recibe un evento firmado.
5. Comprobar que el pago cambia a `paid` solo si `payment_status = paid`.
6. Comprobar que la reserva asociada pasa de `inquiry`/`pending` a `confirmed`.

La decision interna del webhook esta cubierta por unit tests para no depender solo de una prueba manual externa.

## Reglas de promocion a produccion

No promocionar si:

- `pnpm release:check` falla.
- `/api/health` devuelve error critico.
- RLS o Storage policies fallan.
- Stripe test no ha validado webhook firmado.
- Hay datos reales mezclados con staging.
- No hay backup/plan de rollback.

## Fuentes

- Vercel monorepos: https://vercel.com/docs/monorepos
- Vercel GitHub Actions y prebuilt deploys: https://vercel.com/docs/deployments/git/vercel-for-github
- Supabase migrations: https://supabase.com/docs/guides/deployment/database-migrations
