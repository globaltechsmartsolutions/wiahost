# EAS Build

## Objetivo

Preparar WIAHost Mobile para instalarse como app real de Android, primero con APK de preview y despues con AAB para Google Play Internal Testing.

## Estado

- `eas-cli` esta instalado en `apps/mobile`.
- `apps/mobile/eas.json` tiene perfiles `development`, `preview` y `production`.
- `preview` genera APK para instalacion interna.
- `production` genera AAB para Play Store y usa `autoIncrement`.
- Las push notifications ya leen `extra.eas.projectId`, que se rellena al vincular el proyecto con EAS.

## Primer build preview Android

Desde la raiz del repo:

```bash
pnpm eas:login
pnpm eas:configure
pnpm eas:build:android:preview
```

Durante `eas:configure`, Expo vincula el proyecto y anade `extra.eas.projectId` a la configuracion de la app. Ese valor no es secreto y permite que `expo-notifications` obtenga el `ExpoPushToken`.

Antes del build, configura las variables del entorno `preview` en Expo/EAS:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

Para desarrollo local con Expo Go se puede seguir usando `apps/mobile/.env`.

## Build production Android

Cuando preview este validado:

```bash
pnpm eas:build:android:production
```

Este perfil genera `.aab`, que es el formato correcto para Google Play Console.

## Submit a Play Store internal testing

Cuando exista cuenta de Google Play, app creada y credenciales configuradas en EAS:

```bash
pnpm eas:submit:android:internal
```

El perfil `submit.production.android.track` apunta a `internal`.

## Checklist antes de subir

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm --filter mobile exec expo install --check`
- Login mobile en dispositivo real.
- Crear activo desde mobile.
- Crear reserva/tarea/incidencia desde mobile.
- Subir evidencia desde camara o galeria.
- Activar push notifications en Ajustes.
- Validar que `mobile_push_tokens` recibe el token tras build EAS.

## Notas

Sin login Expo, los comandos EAS remotos no pueden ejecutarse desde terminal no interactivo. El repo ya deja los scripts preparados; el primer paso manual imprescindible es `pnpm eas:login`.
