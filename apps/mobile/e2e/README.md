# Mobile E2E

## Herramienta

La suite inicial usa Maestro porque permite flujos YAML sencillos sobre Android/iOS sin acoplar los tests al framework interno de React Native.

## Ejecutar

Requisitos:

- APK/dev build instalado o app abierta desde Expo compatible.
- Dispositivo fisico o emulador Android/iOS.
- Maestro CLI instalada y disponible como `maestro`.

Desde la raiz:

```bash
pnpm test:mobile:e2e
```

Desde `apps/mobile`:

```bash
pnpm test:e2e
```

## Flujos actuales

- `maestro/smoke-demo.yaml`: valida que la app demo abre, muestra dashboard y permite cambiar entre Reservas, Riesgo y Ajustes.

## Siguiente paso

Cuando exista build preview EAS instalada, anadir flujos conectados a Supabase para login demo, alta de activo, alta de incidencia, subida de evidencia y registro push.
