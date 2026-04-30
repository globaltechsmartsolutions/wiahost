# EAS Build

## Objetivo

Preparar WIAHost Mobile para instalarse como app real de Android, primero con APK de preview y despues con AAB para Google Play Internal Testing.

## Estado

- `eas-cli` esta instalado en `apps/mobile`.
- `apps/mobile/eas.json` tiene perfiles `development`, `preview` y `production`.
- `preview` genera APK para instalacion interna.
- `production` genera AAB para Play Store y usa `autoIncrement`.
- Las push notifications ya leen `extra.eas.projectId`, que se rellena al vincular el proyecto con EAS.
- El proyecto esta vinculado a Expo/EAS con `extra.eas.projectId`. Ese identificador no es secreto.
- Metro usa un shim local para `webidl-conversions` y `disableHierarchicalLookup` para evitar dos problemas tipicos de pnpm monorepo: fallos de SHA en EAS Android al resolver rutas internas `.pnpm` y React duplicado durante `expo export --platform web`.
- Primer build preview Android verificado en EAS: `f22caba0-54a4-4e88-954d-39b9cc21afa7`.

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

Si se activa seguridad reforzada de Expo Push Service, configura tambien `EXPO_ACCESS_TOKEN` en el entorno server-side de la web. No es una variable publica y no debe llegar a la app movil.

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
- `pnpm --filter mobile exec expo export:embed --eager --platform android --dev false`
- `pnpm --filter mobile exec expo export --platform web`
- Login mobile en dispositivo real.
- Crear activo desde mobile.
- Crear reserva/tarea/incidencia desde mobile.
- Subir evidencia desde camara o galeria.
- Activar push notifications en Ajustes.
- Validar que `mobile_push_tokens` recibe el token tras build EAS.
- Enviar una prueba desde `POST /api/notifications/push` y confirmar auditoria en `push_notification_deliveries`.

## Notas

Sin login Expo, los comandos EAS remotos no pueden ejecutarse desde terminal no interactivo. El repo ya deja los scripts preparados; el primer paso manual imprescindible es `pnpm eas:login`.

Si EAS falla en la fase `Bundle JavaScript` con un mensaje similar a `Failed to get the SHA-1`, revisa primero `apps/mobile/metro.config.js`: no debe apuntar a archivos dentro de `node_modules/.pnpm/...` para dependencias resueltas manualmente. Usa shims locales dentro de `apps/mobile/src/lib/polyfills` para que Metro pueda hashear los archivos de forma estable en Linux.

Si EAS muestra un aviso de `watcher.unstable_workerThreads`, no bloquea el APK. En esta version no hay ninguna configuracion propia con esa clave; viene de la cadena de herramientas de Expo/Metro y se puede revisar en una actualizacion futura si Expo lo mantiene.
