# Observabilidad

## Objetivo

WIAHost debe poder diagnosticar fallos de staging y produccion sin exponer datos sensibles. La observabilidad inicial se basa en:

- health check publico y seguro;
- request IDs en errores API;
- logs estructurados para errores 5xx;
- reportes JSON de calidad/release;
- Vercel Runtime Logs y futuros Drains.

## Health check

Endpoint:

```text
GET /api/health
```

Uso:

```bash
pnpm check:deployment -- --url https://tu-preview.vercel.app
```

El endpoint devuelve estado de app, Supabase, base de datos, Stripe y metadata segura de runtime. No devuelve secretos.

## Errores API trazables

Todas las respuestas generadas con `apiError` incluyen:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "requestId": "uuid"
  }
}
```

Tambien incluyen cabecera:

```text
X-Request-Id: <requestId>
```

Regla operativa:

- si un usuario reporta un fallo, pedir el `requestId`;
- buscar ese `requestId` en Vercel Runtime Logs;
- cruzarlo con `quality/reports/deployment-health.json` si viene de un despliegue reciente.

## Logs estructurados

Los errores API 5xx generan una linea JSON segura:

```json
{
  "level": "error",
  "event": "api_error",
  "requestId": "uuid",
  "code": "database_unavailable",
  "status": 503,
  "service": "wiahost-web",
  "provider": "vercel",
  "environment": "preview",
  "timestamp": "2026-04-30T00:00:00.000Z"
}
```

No se registran:

- cuerpos de request;
- tokens;
- emails;
- telefonos;
- payloads de canal;
- documentos;
- datos personales.

## Vercel Runtime Logs

En staging/production:

```bash
vercel logs <deployment-url> --level error --since 1h
```

Para seguimiento en vivo:

```bash
vercel logs <deployment-url> --level error --follow
```

## Drains futuros

Cuando el proyecto este en Vercel Pro o Enterprise:

- configurar Log Drain JSON/NDJSON;
- incluir entornos preview y production;
- verificar firma del drain si se recibe en endpoint propio;
- conectar a Datadog, Honeycomb, Axiom, Better Stack o similar.

## Checklist antes de demo

```bash
pnpm quality:observability
pnpm check:deployment -- --url <url>
```

Comprobar:

- `/api/health` devuelve `ok`;
- no hay errores 5xx nuevos;
- los errores API devuelven `requestId`;
- los logs no contienen datos sensibles.

## Estado actual

- Implementado: `/api/health`.
- Implementado: `pnpm check:deployment`.
- Implementado: `error.requestId` y `X-Request-Id`.
- Implementado: logs JSON seguros para errores API 5xx.
- Implementado: auditor `pnpm quality:observability`.
- Pendiente: configurar Vercel Drains o una herramienta externa cuando haya staging real.
