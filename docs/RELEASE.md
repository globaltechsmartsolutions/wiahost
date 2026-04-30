# Release y validacion

## Objetivo

Este documento separa lo que podemos validar automaticamente desde terminal de lo que requiere un dispositivo fisico, credenciales externas o cuentas de stores.

## Gate automatico

Antes de una demo importante o de preparar una build nueva:

```bash
pnpm release:check
```

Este comando ejecuta:

- TypeScript strict.
- Lint.
- Unit tests.
- Auditorias de calidad, rutas, RLS, Storage y readiness.
- Build production web.
- Typecheck/build mobile.
- Bundle nativo Android.
- Bundle nativo iOS.

Genera el reporte:

```text
quality/reports/release-check.json
```

Si el comando pasa, el proyecto queda listo para validacion manual de dispositivo. No sustituye la prueba en movil real.

## Gate manual en GitHub Actions

Tambien existe el workflow manual:

```text
.github/workflows/release-check.yml
```

Se lanza desde GitHub Actions con `Run workflow`. Ejecuta `pnpm release:check`, refresca `quality:summary` y sube los reportes JSON como artefacto. Es util antes de una demo o antes de generar builds EAS, sin depender de que el terminal local este exactamente igual.

## Pendiente manual por dispositivo

Estas pruebas quedan aparcadas hasta que haya tiempo/dispositivo:

- Instalar APK preview Android en un movil fisico.
- Abrir la app instalada, hacer login y revisar dashboard, reservas, inbox, riesgo, activos y ajustes.
- Registrar push notifications desde Ajustes.
- Subir evidencia desde camara.
- Subir evidencia desde galeria.
- Subir un PDF/documento.
- Confirmar que las evidencias aparecen en la ficha y se pueden abrir.
- Probar offline read-only: abrir fichas, quitar conexion y verificar que aparece la informacion cacheada.
- En iPhone real, validar via TestFlight/EAS preview cuando exista Apple Developer.

## APK demo Android

Build demo actual para compartir:

```text
https://expo.dev/accounts/globaltech94/projects/wiahost/builds/29364734-a53b-420e-81b3-17ede3180610
```

Android permite instalar APK directamente. iPhone no usa APK.

## iPhone

Opciones:

- Expo Go para demo rapida sin Apple Developer.
- Build de simulador iOS para Mac/Xcode.
- TestFlight o build interna para iPhone real con Apple Developer.

Build iOS de simulador verificada:

```text
https://expo.dev/accounts/globaltech94/projects/wiahost/builds/7a041ea5-20f9-4547-94f5-ae96eb7edce9
```

## Antes de produccion SaaS

Ademas de `pnpm release:check`, antes de publicar entorno real:

```bash
pnpm quality:prod:production
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
pnpm audit:lighthouse
```

Revisiones externas:

- Supabase hosted con backups y RLS probado con usuarios reales.
- Vercel con variables server-only configuradas.
- Stripe en modo test con webhook firmado.
- Cuenta Google Play Console para Android.
- Apple Developer para TestFlight/App Store.
- Politica de privacidad, terminos, capturas e iconos finales.
