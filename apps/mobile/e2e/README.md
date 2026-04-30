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

La suite por defecto ejecuta solo flujos demo contra un APK sin variables Supabase, ideal para validar que la app abre, navega y no rompe la experiencia base.

Para flujos conectados a Supabase:

```bash
$env:WIAHOST_EMAIL="operaciones@wiahost.local"
$env:WIAHOST_PASSWORD="Password123!"
pnpm test:mobile:e2e:connected
```

En bash/zsh:

```bash
WIAHOST_EMAIL=operaciones@wiahost.local WIAHOST_PASSWORD='Password123!' pnpm test:mobile:e2e:connected
```

## Flujos actuales

- `maestro/demo/01-smoke-demo.yaml`: valida que la app demo abre, muestra dashboard y permite cambiar entre Reservas, Riesgo y Ajustes.
- `maestro/demo/02-detail-navigation.yaml`: recorre detalles demo de activo, reserva, inbox, tarea e incidencia.
- `maestro/demo/03-readonly-create-screens.yaml`: confirma que las altas protegidas muestran estado read-only cuando Supabase no esta configurado.
- `maestro/connected/01-login.yaml`: valida login real con Supabase.
- `maestro/connected/02-create-property.yaml`: crea un activo real desde mobile.
- `maestro/connected/03-create-incident.yaml`: crea un activo auxiliar y una incidencia real desde mobile.
- `maestro/connected/04-incident-status.yaml`: crea una incidencia real y valida que el cambio de estado esta disponible desde mobile.
- `maestro/connected/05-task-status.yaml`: crea una tarea real y valida que puede pasar a en curso desde mobile.
- `maestro/connected/06-reservation-status.yaml`: crea una reserva real y valida el cambio de estado operativo desde mobile.
- `maestro/connected/07-push-readiness.yaml`: valida que la sesion conectada expone el bloque de registro push en Ajustes.

## Siguiente paso

Ampliar flujos conectados con subida de evidencia real y registro push con permisos controlados en dispositivo fisico.
