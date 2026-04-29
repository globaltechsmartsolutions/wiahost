# Seguridad y readiness

## Principios

- No se suben secretos reales al repositorio.
- Las claves `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL` y `RESEND_API_KEY` son server-only.
- Ninguna clave server-only debe usarse desde componentes con `"use client"`.
- Supabase RLS es la defensa principal de datos. La UI y los Route Handlers ayudan, pero no sustituyen RLS.
- Stripe solo confirma pagos desde webhook firmado y con `payment_status = paid`.
- Las cuentas externas de canales se documentan en `channel_accounts`, pero las credenciales reales deben vivir en variables seguras o vault del proveedor.

## Auditor local

El comando principal es:

```bash
pnpm quality:prod
```

Genera `quality/reports/production-readiness.json` y revisa:

- Que `.env.example` y `apps/web/.env.example` documenten las variables necesarias.
- Que no haya patrones evidentes de secretos reales en ejemplos.
- Que `apps/web/.env.local`, si existe, tenga valores configurados para desarrollo conectado.
- Que Stripe Checkout no este configurado sin `STRIPE_WEBHOOK_SECRET`.
- Que variables server-only no aparezcan en componentes cliente.
- Que `pnpm quality:summary` pueda recoger el resultado como parte de la memoria de calidad.

Para una comprobacion de entorno de produccion:

```bash
pnpm quality:prod:production
```

En modo produccion se espera `https`, sin `localhost`, y se bloquea si faltan variables criticas.

## Antes de produccion

- Crear proyecto Supabase hosted y aplicar migraciones.
- Activar backups y revisar RLS con usuarios reales de prueba.
- Configurar variables en Vercel sin copiarlas al repositorio.
- Probar Stripe con claves de test, webhook firmado y eventos reales.
- Revisar Storage policies antes de subir documentos sensibles.
- Activar logs, alertas y monitorizacion de errores.
- Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build:web`, `pnpm quality:prod`, `pnpm test:e2e`, `pnpm test:a11y` y `pnpm test:visual`.
