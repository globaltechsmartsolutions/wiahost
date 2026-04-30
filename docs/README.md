# Documentacion de WIAHost

Este directorio concentra la documentacion viva del producto. La idea es que cualquier persona pueda entender rapidamente que estamos construyendo, como se levanta, como esta arquitecturado y hacia donde va.

## Lectura recomendada

1. `PRODUCT.md`: vision, usuarios, modulos y posicionamiento.
2. `ROADMAP.md`: fases de ejecucion.
3. `SETUP.md`: como levantar el proyecto en local.
4. `ARCHITECTURE.md`: estructura tecnica del monorepo.
5. `DATABASE.md`: modelo Supabase y migraciones.
6. `AI.md`: estrategia IA canonica.
7. `QUALITY_AND_AUDIT_STRATEGY.md`: tests, auditoria visual y memoria de calidad.
8. `SECURITY.md`: secretos, RLS, Stripe y readiness de produccion.
9. `DEPLOYMENT.md`: staging, Vercel, Supabase hosted y promocion a produccion.
10. `OBSERVABILITY.md`: health checks, request IDs, logs y diagnostico de staging.
11. `MOBILE.md`: app Expo, entorno movil y Play Store.
12. `RELEASE.md`: validacion automatica, pruebas manuales pendientes y salida a stores.

## Documentos principales

| Documento                       | Rol                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `PRODUCT.md`                    | Define el producto, usuarios y modulos funcionales.                            |
| `ARCHITECTURE.md`               | Explica apps, packages, Supabase y estado de integracion.                      |
| `DATABASE.md`                   | Resume migraciones, tablas, storage, seed y pendientes de datos.               |
| `SETUP.md`                      | Guia corta de instalacion local y comandos.                                    |
| `ROADMAP.md`                    | Fases de producto, web, mobile, IA y SaaS.                                     |
| `MOBILE.md`                     | App movil Expo, entorno local, arquitectura nativa y plan Play Store.          |
| `UI_RESEARCH.md`                | Direccion visual y referencias PMS/CRM.                                        |
| `QUALITY_AND_AUDIT_STRATEGY.md` | Estrategia de testing, visual regression, accesibilidad y auditor inteligente. |
| `SECURITY.md`                   | Reglas de secretos, checks de entorno y checklist antes de produccion.         |
| `DEPLOYMENT.md`                 | Flujo local/staging/production, Vercel, Supabase hosted y checks de salida.    |
| `OBSERVABILITY.md`              | Health checks, request IDs, logs estructurados y operativa de diagnostico.     |
| `RELEASE.md`                    | Gate de release, APK demo, iOS/TestFlight y checklist manual pendiente.        |
| `AI.md`                         | Documento maestro de IA: producto, arquitectura, datos, fases y guardrails.    |

## Regla editorial

- Si una decision es canonica, debe aparecer en `PRODUCT.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE.md` o `AI.md`.
- No mantenemos documentacion antigua o duplicada. Si un documento deja de ser fuente de verdad, se fusiona en el documento canonico y se elimina.
- Evitar repetir listas completas en varios docs. Mejor enlazar al documento propietario.
- Mantener interfaz visible en espanol y codigo/entidades tecnicas en ingles.
