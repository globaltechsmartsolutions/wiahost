# Incident response

## Objetivo

Tener una guia corta para actuar cuando una demo, staging o produccion falle. La prioridad es recuperar servicio, proteger datos y dejar aprendizaje documentado.

## Severidades

| Severidad | Criterio                           | Respuesta                     |
| --------- | ---------------------------------- | ----------------------------- |
| SEV1      | App caida, login roto, pagos rotos | Atencion inmediata y rollback |
| SEV2      | Modulo critico degradado           | Mitigar el mismo dia          |
| SEV3      | Bug con workaround                 | Planificar fix                |
| SEV4      | Mejora o ruido de monitorizacion   | Backlog                       |

## Primeros 10 minutos

1. Confirmar URL afectada y entorno: local, preview, staging o production.
2. Pedir `requestId` si el error viene de API.
3. Ejecutar health check:

```bash
pnpm check:deployment -- --url <url>
```

4. Revisar runtime logs:

```bash
vercel logs <deployment-url> --level error --since 1h
```

5. Revisar ultimo commit/despliegue.
6. Si afecta a pagos, no reintentar manualmente cobros sin verificar Stripe Dashboard.
7. Si afecta a datos, no ejecutar scripts destructivos.

## Diagnostico rapido

### App no carga

- revisar Vercel deployment status;
- revisar `pnpm build:web` local;
- revisar cabeceras/CSP si el fallo es de navegador;
- revisar variables `NEXT_PUBLIC_*`.

### Login falla

- revisar Supabase Auth;
- revisar `NEXT_PUBLIC_SUPABASE_URL`;
- revisar `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- comprobar cookies/sesion en navegador.

### API devuelve error

- copiar `error.requestId`;
- buscarlo en logs;
- revisar `error.code`;
- comprobar `/api/health`.

### Pagos fallan

- comprobar `STRIPE_SECRET_KEY`;
- comprobar `STRIPE_WEBHOOK_SECRET`;
- revisar eventos en Stripe Dashboard;
- verificar que el pago solo pasa a `paid` con `payment_status = paid`.

### Mobile falla

- confirmar si es Expo Go, APK preview, simulador iOS o build production;
- revisar `apps/mobile/.env`;
- revisar EAS build logs;
- si es dispositivo fisico, anotar modelo, Android/iOS, red y captura.

## Rollback

En Vercel:

1. abrir deployment anterior sano;
2. promoverlo si el fallo es SEV1/SEV2;
3. dejar comentario interno con commit revertido;
4. no borrar el deployment fallido hasta capturar logs.

## Comunicacion

Mensaje interno recomendado:

```text
Incidente: <titulo>
Severidad: SEV1/SEV2/SEV3/SEV4
Entorno: preview/staging/production
Impacto: <quien esta afectado>
requestId: <si existe>
Estado: investigando/mitigado/resuelto
Siguiente actualizacion: <hora>
```

## Cierre

Un incidente no esta cerrado hasta que:

- hay causa probable;
- hay fix o mitigacion;
- se ha ejecutado `pnpm quality:ci`;
- se ha actualizado documentacion o test si aplica;
- se ha anotado aprendizaje en `quality/audit-memory/previous-findings.jsonl` si fue una regresion.

## Comandos utiles

```bash
pnpm accounts:check
pnpm quality:ci
pnpm release:check
pnpm check:deployment -- --url <url>
pnpm --filter web test
pnpm --filter web typecheck
pnpm build:web
```
