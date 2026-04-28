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
- `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build:web`.
- Tests iniciales de validadores compartidos.
- Test inicial de configuracion Supabase.
- Verificacion manual con Playwright para rutas principales.

Falta:

- `playwright.config.ts` formal.
- Tests E2E versionados.
- Tests visuales con snapshots.
- Auditoria de accesibilidad con axe.
- Lighthouse CI con budgets.
- Memoria de auditoria.
- Workflow CI de calidad con artefactos.

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

Regla: cada modulo nuevo debe traer al menos un flujo Playwright.

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
- `/login`
- `/register`
- `/dashboard`
- `/properties`
- `/properties/new`

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

En local ya vimos Lighthouse 100/100/100/100 en landing desktop sin throttling. Debe convertirse en gate de CI con condiciones reproducibles.

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

- Crear `playwright.config.ts`.
- Crear `apps/web/e2e/smoke.spec.ts`.
- Validar landing, login, register, dashboard, properties y new property.
- Guardar traces en fallo.

### Paso 2

- Crear `apps/web/e2e/visual.spec.ts`.
- Baselines desktop/mobile para landing, dashboard y properties.
- Desactivar animaciones en modo test.

### Paso 3

- Instalar `@axe-core/playwright`.
- Crear `apps/web/e2e/accessibility.spec.ts`.
- Ejecutar rutas criticas con WCAG A/AA.

### Paso 4

- Instalar Lighthouse CI.
- Crear `.lighthouserc.cjs`.
- Anadir budgets.
- Publicar reportes como artefactos en GitHub Actions.

### Paso 5

- Crear `quality/audit-memory`.
- Crear script `pnpm audit:web`.
- Generar reporte JSON local con rutas, screenshots y resultados.

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
