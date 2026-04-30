# Seguridad y readiness

## Principios

- No se suben secretos reales al repositorio.
- Las claves `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, `EXPO_ACCESS_TOKEN` y `RESEND_API_KEY` son server-only.
- Ninguna clave server-only debe usarse desde componentes con `"use client"`.
- Supabase RLS es la defensa principal de datos. La UI y los Route Handlers ayudan, pero no sustituyen RLS.
- Stripe solo confirma pagos desde webhook firmado y con `payment_status = paid`.
- La decision del webhook Stripe esta cubierta por unit tests: eventos pagados, pagos asincronos, sesiones sin referencia y sesiones no pagadas.
- Las cuentas externas de canales se documentan en `channel_accounts`, pero las credenciales reales deben vivir en variables seguras o vault del proveedor.
- Los documentos usan buckets privados y URL firmadas temporales para subida/descarga. El navegador solo recibe un token temporal de Storage; no se deben publicar rutas de storage como enlaces permanentes.
- Las push notifications usan tokens de dispositivo guardados con RLS. `EXPO_ACCESS_TOKEN`, si se activa en EAS, solo puede vivir en servidor.
- Los endpoints publicos de reserva directa y confirmacion de checkout demo tienen rate limit defensivo por IP y contexto. Es una proteccion MVP en memoria; para produccion con varias regiones se debe migrar a Redis/Vercel KV/Upstash o un WAF gestionado.
- La web aplica cabeceras HTTP de seguridad desde `apps/web/security-headers.ts`: anti-clickjacking, `nosniff`, referrer policy, permissions policy, HSTS y CSP report-only. CSP queda report-only hasta validar Supabase, Stripe, Storage y scripts de Next en staging.
- Los errores API devuelven `error.requestId` y cabecera `X-Request-Id` para cruzar incidencias con logs de staging/produccion sin exponer datos sensibles.

## Auditor local

El comando principal es:

```bash
pnpm quality:prod
pnpm quality:db
pnpm quality:staging
pnpm release:check
```

Genera `quality/reports/production-readiness.json`, `quality/reports/database-security.json` y revisa:

- Que `.env.example` y `apps/web/.env.example` documenten las variables necesarias.
- Que no haya patrones evidentes de secretos reales en ejemplos.
- Que `apps/web/.env.local`, si existe, tenga valores configurados para desarrollo conectado.
- Que Stripe Checkout no este configurado sin `STRIPE_WEBHOOK_SECRET`.
- Que variables server-only no aparezcan en componentes cliente.
- Que las cabeceras HTTP de seguridad sigan presentes.
- Que cada tabla publica creada en migraciones tenga RLS activado y al menos una politica.
- Que cada bucket de Storage creado en migraciones tenga politica sobre `storage.objects`.
- Que `pnpm quality:summary` pueda recoger el resultado como parte de la memoria de calidad.
- Que `pnpm release:check` pueda dejar una foto completa de release sin depender de secretos ni dispositivos fisicos.

`pnpm quality:staging` genera `quality/reports/staging-readiness.json` y comprueba que el proyecto tenga guia de deployment, workflow manual de Vercel, variables de entorno documentadas y lista de secretos GitHub necesarios antes de conectar cuentas reales.

## Health endpoint

`GET /api/health` devuelve un snapshot JSON de readiness:

- URL publica.
- Supabase publico.
- Service role server-only.
- Consulta server-side a base de datos.
- Stripe Checkout y webhook.
- Runtime/deploy seguro: entorno, proveedor, rama y commit corto cuando Vercel lo expone.

El endpoint no devuelve valores de secretos. Sirve para monitores externos, trazabilidad de despliegues y para la tarjeta "Readiness tecnico" de Settings.

Para una comprobacion de entorno de produccion:

```bash
pnpm quality:prod:production
```

En modo produccion se espera `https`, sin `localhost`, y se bloquea si faltan variables criticas.

## Antes de produccion

- Crear proyecto Supabase hosted y aplicar migraciones.
- Activar backups y revisar RLS con usuarios reales de prueba.
- Configurar variables en Vercel sin copiarlas al repositorio.
- Ejecutar `pnpm quality:staging` antes de crear el primer despliegue preview.
- Probar Stripe con claves de test, webhook firmado y eventos reales.
- Revisar Storage policies antes de subir documentos sensibles.
- Activar logs, alertas y monitorizacion de errores.
- Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build:web`, `pnpm quality:db`, `pnpm quality:prod`, `pnpm test:e2e`, `pnpm test:a11y` y `pnpm test:visual`.
