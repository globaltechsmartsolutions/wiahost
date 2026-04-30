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

Hay dos caminos validos.

### Opcion A: Git integration

Crear un proyecto Vercel conectado al repo y configurarlo como monorepo:

- Framework: Next.js.
- Root Directory: `apps/web`.
- Install Command: `pnpm install --frozen-lockfile`.
- Build Command: `pnpm build`.
- Output: automatico de Next.js.

Vercel soporta monorepos con workspaces. Si el root `apps/web` no resolviera paquetes workspace en algun despliegue, usar la opcion B con CI prebuilt.

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

## Checklist antes de crear staging

```bash
pnpm install
pnpm quality:staging
pnpm release:check
pnpm quality:prod:production
```

`quality:staging` comprueba que este documento, el workflow manual de Vercel, los scripts de release y las variables de entorno documentadas siguen presentes antes de tocar cuentas reales.

`quality:prod:production` exige URLs `https` y bloquea configuraciones de produccion inseguras. En local puede fallar si no exportas variables reales de staging/production en la terminal; eso es correcto.

## Smoke test de staging

Cuando exista URL:

```bash
curl https://staging.wiahost.com/api/health
```

Debe devolver:

- `status: "ok"` o `degraded` si falta una integracion opcional;
- `runtime.environment`;
- `runtime.provider`;
- `runtime.commit`;
- checks sin valores secretos.

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
