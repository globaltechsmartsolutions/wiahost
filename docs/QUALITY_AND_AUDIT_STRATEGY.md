# Quality and intelligent audit strategy

## Objetivo

WIAHost necesita una red de seguridad que permita cambiar UI, flujos y datos sin romper el producto. La estrategia no debe depender de una sola herramienta. Debe combinar pruebas deterministas, auditoria visual, accesibilidad, rendimiento, trazas y una memoria versionada del producto.

La regla principal:

- Los tests deterministas bloquean merges.
- El auditor inteligente ayuda a revisar riesgos, explicar cambios y recordar zonas fragiles.
- La IA no debe ser el unico gate de calidad, porque puede equivocarse. Debe producir reportes estructurados y revisables.

## Estado actual

Ya existe:

- Vitest en `packages/shared`, `packages/database` y `apps/web`.
- Playwright instalado en `apps/web`.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` y `pnpm build:web`.
- Tests iniciales de validadores compartidos.
- Test inicial de configuracion Supabase.
- `playwright.config.ts` formal en `apps/web`.
- Tests E2E versionados para smoke publico/auth, login demo, iCal publico/import, mensajes entrantes de canal, pricing con sync outbound, notificaciones, creacion/edicion de reserva UI/API, leads directos con preparacion de pago, owners/settings, guest list/detail/edit, calendar blocks y mutaciones API completas de tareas, incidencias e inbox.
- Auditoria de accesibilidad con `@axe-core/playwright` sobre rutas publicas, reserva directa, protegidas, leads, notifications, audit, workflows, distribution, pricing, calendario, guests, documentos, detalle, edicion de operaciones, owners, statements y settings.
- Baseline visual inicial para landing/auth y check de overflow/alineacion de reserva directa, leads, notifications, dashboard, operaciones, editores, audit, workflows, distribution, pricing, calendar/guests, documentos, owners, statements y settings.
- Memoria versionada en `quality/audit-memory`.
- Auditor estatico `pnpm quality:routes` que cruza `route-inventory.json` con las suites de accesibilidad y visual para evitar rutas nuevas sin cobertura.
- Lighthouse CI configurado para landing/login/register con budgets iniciales, reportes en filesystem y wrapper local para estabilizar Chrome en Windows.
- CI inicial con typecheck, lint, unit tests y build web.

Falta:

- Endurecer Lighthouse CI cuando haya historico estable.
- Workflow CI de calidad con artefactos Playwright cuando activemos esas suites en CI.

## Piramide de calidad propuesta

### 1. Unit tests

Herramienta: Vitest.

Objetivo:

- Validadores Zod.
- Scoring o logica de negocio futura.
- Mappers entre Supabase y UI.
- Helpers de permisos.
- Utilidades de fechas y formatos.

Debe ejecutarse en cada push.

### 2. Component tests

Herramientas: Vitest + Testing Library.

Objetivo:

- Formularios web: property form, login, register, reservas, incidencias.
- Estados vacios, loading y error.
- Validacion visual minima de etiquetas, botones y errores.

No sustituye al E2E. Protege componentes pequenos.

### 3. E2E funcional

Herramienta: Playwright.

Suites recomendadas:

- `smoke`: landing, login, register, dashboard, properties.
- `critical`: crear propiedad, crear reserva, crear tarea, responder mensaje.
- `auth`: login, logout, rutas protegidas.
- `data`: flujos con Supabase local y seed demo.
- `mobile-web`: mismas rutas con viewport movil.

Regla: cada modulo nuevo debe traer al menos un flujo Playwright. Mientras usemos Supabase local y Next dev server compartidos, Playwright corre con `workers: 1` para priorizar determinismo frente a velocidad.

### 4. Visual regression

Primera opcion: Playwright native visual comparisons con `expect(page).toHaveScreenshot()`.

Por que:

- Ya usamos Playwright.
- No requiere SaaS externo.
- Permite baselines en Git.
- Es suficiente para MVP y primeras demos.

Escenarios iniciales:

- Landing desktop y mobile.
- Dashboard desktop.
- Dashboard mobile/tablet cuando este adaptado.
- Properties list.
- New property form.
- Calendar.
- Inbox.

Buenas practicas:

- Fijar viewport.
- Fijar idioma y timezone.
- Congelar fecha/hora en tests.
- Usar seed estable.
- Desactivar animaciones en modo test.
- Enmascarar datos dinamicos si los hay.
- Guardar screenshots solo de rutas criticas, no de todo.

Fase posterior:

- Argos si queremos visual review muy centrado en Playwright y GitHub.
- Chromatic si montamos Storybook y queremos revisar componentes/paginas con una UI de aprobacion.
- Percy tambien es viable, pero para nuestro stack actual Playwright + Argos/Chromatic encaja mejor.

### 5. Accessibility audit

Herramienta: `@axe-core/playwright`.

Objetivo:

- Ejecutar reglas WCAG A/AA sobre rutas principales.
- Detectar inputs sin label, contraste, estructura ARIA y problemas de navegacion.
- No sustituye revision manual, pero evita errores basicos.

Rutas iniciales:

- `/`
- `/book/:slug`
- `/login`
- `/register`
- `/dashboard`
- `/properties`
- `/properties/new`
- `/properties/:propertyId`
- `/properties/:propertyId/edit`
- `/reservations`
- `/calendar`
- `/guests`
- `/reservations/:reservationId`
- `/reservations/:reservationId/edit`
- `/tasks`
- `/tasks/:taskId`
- `/tasks/:taskId/edit`
- `/incidents`
- `/incidents/:incidentId`
- `/incidents/:incidentId/edit`
- `/inbox`
- `/leads`
- `/notifications`
- `/owners`
- `/workflows`
- `/distribution`
- `/pricing`
- `/settings`

### 6. Performance, SEO and best practices

Herramienta: Lighthouse CI.

Objetivo:

- Evitar que la landing y el dashboard se degraden.
- Definir budgets minimos.
- Guardar reportes como artefactos de CI.

Budgets iniciales recomendados:

- Landing performance >= 0.90.
- Landing accessibility >= 0.95.
- Landing SEO >= 0.95.
- Dashboard accessibility >= 0.95.
- LCP landing < 2.5 s en CI.
- CLS < 0.1.

En local ya vimos Lighthouse 100/100/100/100 en landing desktop sin throttling. La primera version automatizada audita `/`, `/login` y `/register` en desktop, guarda reportes en `quality/reports/lighthouse` y corre en CI como paso no bloqueante. Cuando tengamos historico estable, subiremos budgets y lo convertiremos en gate bloqueante.

## Auditor inteligente con memoria

### Principio

La memoria no debe depender solo de la memoria del modelo. Debe vivir en el repo.

Propuesta:

```text
quality/
  audit-memory/
    product-rules.md
    known-risks.md
    route-inventory.json
    visual-baselines.md
    previous-findings.jsonl
    accepted-differences.jsonl
  reports/
    .gitkeep
```

`quality/audit-memory/product-rules.md`

- Reglas visuales del producto.
- Ejemplo: dashboard profesional, cards alineadas, sidebar sin barras raras, mobile sin overflow.
- Regla obligatoria: no puede haber huecos muertos entre cards del dashboard; si dos cards comparten fila en desktop, deben alinear borde superior e inferior.
- Regla obligatoria: el numero de cards puede variar, pero los huecos entre ellas deben caer sobre la misma rejilla/gutter del dashboard.
- Regla obligatoria: responsive validado en tamanos estandar 1366, 1440, 1536 y 1920; el multi-calendario no debe mostrar scrollbar horizontal interno en esos anchos.
- Regla obligatoria: en portatil el dashboard no debe parecer ampliado; las metricas deben entrar en cuatro columnas y el hero debe mantener una escala compacta.
- Regla obligatoria: la primera vista del dashboard debe priorizar densidad operativa, no una estetica de landing; sidebar, topbar, hero y cards deben mantenerse compactos.

`quality/audit-memory/known-risks.md`

- Zonas fragiles.
- Ejemplo: multi-calendario, sidebar, formularios largos, rutas protegidas, Supabase no configurado.

`quality/audit-memory/route-inventory.json`

- Rutas criticas.
- Selector principal esperado.
- Estado esperado de auth.
- Tipo de prueba requerida.

`quality/audit-memory/previous-findings.jsonl`

- Fallos encontrados historicamente.
- Fecha, ruta, severidad, causa, solucion.

`quality/audit-memory/accepted-differences.jsonl`

- Cambios visuales aceptados.
- Evita redescubrir la misma diferencia aprobada.

### Como funcionaria el auditor

Entrada:

- `git diff`.
- Lista de rutas cambiadas.
- Capturas Playwright actuales.
- Resultado de tests.
- Resultado axe.
- Resultado Lighthouse.
- Memoria versionada.

Salida:

```json
{
  "riskLevel": "low | medium | high",
  "summary": "string",
  "changedRoutes": ["string"],
  "visualConcerns": ["string"],
  "functionalConcerns": ["string"],
  "accessibilityConcerns": ["string"],
  "requiredManualChecks": ["string"],
  "recommendedTests": ["string"],
  "mergeRecommendation": "approve | review_required | block"
}
```

Uso recomendado:

- En local: comando manual `pnpm audit:web`.
- En PR: comentario automatico con reporte.
- En main/nightly: reporte completo con historico.

Importante:

- La IA puede recomendar `review_required`, pero el bloqueo real debe venir de tests deterministas.
- Si en el futuro usamos OpenAI, la salida debe ser JSON estructurado para que sea estable y parseable.
- No se deben subir secretos ni screenshots con datos sensibles.

## CI recomendado

### Pull request

Rapido y bloqueante:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm quality:routes
pnpm build:web
pnpm test:e2e -- --grep @smoke
pnpm test:e2e -- --grep @a11y
```

Artefactos:

- Playwright report.
- Traces solo en fallo.
- Screenshots solo en fallo o visual diff.

### Nightly

Mas lento:

```bash
supabase start
pnpm db:reset
pnpm db:types
pnpm test:e2e
pnpm audit:lighthouse
pnpm audit:visual
```

### Release

Antes de demo o despliegue:

- Full E2E.
- Visual regression completa.
- Lighthouse con budgets.
- Auditor inteligente.
- Revision manual de rutas principales.

## Playwright config recomendado

Proyectos:

- `chromium-desktop`
- `webkit-desktop` cuando el producto este mas maduro.
- `mobile-chrome`
- `mobile-safari` cuando queramos validar responsive serio.

Opciones:

- `trace: "on-first-retry"`
- `screenshot: "only-on-failure"`
- `video: "retain-on-failure"`
- `retries: 2` en CI.
- `workers: 1` para visual snapshots al principio.

## Criterios de "no se rompe"

Un cambio no deberia entrar si:

- Rompe typecheck, lint, unit tests o build.
- Rompe una ruta critica.
- Introduce un error visible de consola.
- Crea overflow horizontal en mobile.
- Cambia visualmente una pagina critica sin aprobar baseline.
- Baja Lighthouse por debajo del budget.
- Introduce errores axe severos.
- Toca auth/data y no trae test funcional.

## Plan de implementacion

### Paso 1

- Hecho: crear `playwright.config.ts`.
- Hecho: crear `apps/web/e2e/smoke.spec.ts`.
- Hecho: crear `apps/web/e2e/operations.spec.ts`.
- Hecho: validar landing, login, register, dashboard protegido, login demo, reserva UI/API, tareas, incidencias, inbox, owners, settings, guests y calendar.
- Hecho: guardar traces, screenshots y video en fallo.

### Paso 2

- Hecho: crear `apps/web/e2e/visual.spec.ts`.
- Hecho: baseline desktop/mobile para landing y pantallas auth.
- Hecho: check visual artifact-only de `/book/:slug` en mobile y desktop portatil sin overflow.
- Hecho: check de dashboard sin overflow horizontal y con calendario/cola prioritaria alineados.
- Hecho: check visual de rutas operativas `/reservations`, `/tasks`, `/incidents` e `/inbox` sin overflow en desktop portatil y con filtros visibles.
- Hecho: check visual de pipeline comercial `/leads` sin overflow en desktop portatil y con CTA de conversion visibles.
- Hecho: check visual de rutas detalle/edicion de reservas, tareas e incidencias sin overflow en desktop portatil.
- Hecho: check visual de audit/automations/workflows/documents/distribution/owners/payments/settings/statements sin overflow en desktop portatil.
- Hecho: check visual de calendar/guests sin overflow en desktop portatil.
- Hecho: desactivar animaciones en modo test.

### Paso 3

- Hecho: instalar `@axe-core/playwright`.
- Hecho: crear `apps/web/e2e/accessibility.spec.ts`.
- Hecho: ejecutar rutas criticas, detalle y edicion con WCAG A/AA bloqueando violaciones criticas/serias.

### Paso 4

- Hecho: instalar Lighthouse CI.
- Hecho: crear `.lighthouserc.cjs`.
- Hecho: anadir budgets iniciales para performance, accesibilidad, best practices, SEO, FCP, LCP y CLS.
- Hecho: publicar reportes como artefactos en GitHub Actions.
- Pendiente: endurecer budgets y activar dashboard autenticado cuando tengamos un login estable para Lighthouse.

### Paso 5

- Hecho: crear `quality/audit-memory`.
- Hecho: crear script `pnpm audit:web`.
- Hecho: crear `pnpm quality:routes` con reporte JSON de cobertura de rutas frente a a11y/visual.
- Pendiente: generar reporte JSON consolidado con rutas, screenshots, Lighthouse y resultados E2E.

### Paso 6

- Integrar auditor inteligente en PR como comentario no bloqueante.
- Cuando sea estable, convertir hallazgos criticos repetidos en tests deterministas.

## Herramientas investigadas

- Playwright visual comparisons: `toHaveScreenshot()` permite comparar screenshots contra baselines.
- Playwright traces: trazas, screenshots y video ayudan a depurar CI sin repetir manualmente.
- axe-core con Playwright: recomendado para automatizar checks WCAG.
- Lighthouse CI: permite budgets de performance, SEO y best practices en CI.
- Argos: visual review especializado para Playwright/GitHub.
- Chromatic: fuerte si usamos Storybook o queremos visual review cloud con DOM/assets.
- Checkly: util para monitorizacion sintetica post-deploy con tests Playwright.
- OpenAI Structured Outputs y vision: opcion futura para auditoria inteligente con salida JSON y analisis multimodal de capturas.

## Decision recomendada para WIAHost

Para ahora:

- Playwright native E2E + visual snapshots.
- axe-core Playwright.
- Lighthouse CI.
- Memoria versionada en repo.

Para despues:

- Argos si visual diffs empiezan a ser pesados.
- Checkly cuando haya entorno staging/produccion.
- Auditor IA no bloqueante con JSON estructurado.

Esta combinacion es profesional, controlable y barata al principio. Nos evita meter un SaaS antes de necesitarlo, pero deja el camino preparado para subir de nivel.

## Fuentes

- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
- Playwright accessibility testing with axe: https://playwright.dev/docs/accessibility-testing
- Lighthouse CI: https://googlechrome.github.io/lighthouse-ci/docs/introduction-to-ci.html
- Argos visual testing: https://argos-ci.com/
- Chromatic Playwright docs: https://www.chromatic.com/docs/playwright/
- Checkly Playwright monitoring: https://www.checklyhq.com/docs/playwright-checks/
- OpenAI Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- OpenAI image and vision inputs: https://platform.openai.com/docs/guides/images-vision
