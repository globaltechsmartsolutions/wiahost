# Mobile

## Objetivo

WIAHost tiene app movil real con Expo React Native en `apps/mobile`. No es una WebView: comparte backend, auth, tipos y validaciones con la web, pero la UI es nativa y esta pensada para operacion rapida desde el movil.

## Estado actual

- App Expo creada en `apps/mobile`.
- Expo Router con tabs moviles: Dashboard, Activos, Reservas, Inbox, Riesgo y Ajustes.
- Fichas moviles para activo, reserva, conversacion, tarea e incidencia.
- Alta nativa de activos desde `/properties/new`.
- Edicion nativa de activos desde `/properties/edit/[propertyId]`.
- Alta nativa de incidencias desde `/incidents/new`.
- Alta nativa de reservas manuales/directas desde `/reservations/new`.
- Alta nativa de tareas desde `/tasks/new`.
- Respuesta outbound desde ficha de inbox movil.
- Historial completo de conversaciones desde `/inbox/[conversationId]`.
- Cambio de estado desde mobile para conversaciones, reservas, tareas e incidencias.
- Subida de evidencias/fotos desde camara o galeria en activos, incidencias y tareas, usando Supabase Storage y registros en `documents`.
- Registro de dispositivo para push notifications desde Ajustes, con permisos nativos, canal Android `operations` y guardado en `mobile_push_tokens`.
- Login y registro con Supabase Auth.
- Persistencia de sesion con `@react-native-async-storage/async-storage`.
- TanStack Query para cache y refresco de datos operativos.
- Conexion directa a Supabase con RLS.
- Fallback demo si no hay variables `EXPO_PUBLIC_*`, para poder revisar la experiencia sin romper el arranque.
- NativeWind preparado para evolucionar UI movil sin bloquear el MVP actual. La UI actual usa `StyleSheet`; `withNativeWind` en Metro queda para una pasada especifica porque en Windows/Node 24 rompia `expo export`.
- TypeScript strict y scripts `typecheck`, `lint`, `build` y `test`.

## Arquitectura

```text
apps/mobile/
  app/
    (tabs)/
      index.tsx
      properties.tsx
      reservations.tsx
      inbox.tsx
      incidents.tsx
      settings.tsx
    properties/[propertyId].tsx
    properties/edit/[propertyId].tsx
    properties/new.tsx
    reservations/[reservationId].tsx
    reservations/new.tsx
    inbox/[conversationId].tsx
    incidents/[incidentId].tsx
    incidents/new.tsx
    tasks/[taskId].tsx
    tasks/new.tsx
    login.tsx
    register.tsx
    _layout.tsx
  src/
    components/
    features/auth/
    hooks/
    lib/
```

La app importa:

- `@wiahost/shared` para roles y validadores.
- `@wiahost/database` para tipos Supabase.
- `@supabase/supabase-js` para Auth y queries directas.

## Variables

Crear `apps/mobile/.env` desde:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Variables necesarias:

```bash
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=replace_with_local_or_project_anon_key
```

En dispositivo fisico puede hacer falta usar la IP LAN del ordenador en vez de `127.0.0.1`.

## Comandos

```bash
pnpm dev:mobile
pnpm --filter mobile android
pnpm --filter mobile ios
pnpm --filter mobile web
pnpm --filter mobile typecheck
pnpm --filter mobile exec expo export --platform web
```

CI ejecuta `pnpm build:mobile` y `expo export --platform web` como guardarrail ligero hasta que se configure EAS Build.

Los comandos EAS estan disponibles desde la raiz:

```bash
pnpm eas:login
pnpm eas:configure
pnpm eas:build:android:preview
pnpm eas:build:android:production
pnpm eas:submit:android:internal
```

La guia operativa completa esta en `docs/EAS_BUILD.md`.

## Funciones prioritarias siguientes

- Envio servidor de push notifications para check-in, SLA de inbox e incidencias cuando este configurado EAS projectId y credenciales Expo.
- Previsualizacion enriquecida de evidencias y subida de PDF/documentos.
- Offline read-only basico para tareas del dia.
- Tests e2e mobile con Maestro o Detox cuando el flujo nativo se estabilice.

## Push notifications

La app movil usa `expo-notifications` y `expo-device`. Desde `/settings`, el usuario puede activar avisos. El flujo:

- pide permiso nativo de notificaciones;
- crea canal Android `operations`;
- obtiene `ExpoPushToken` si existe `EAS projectId`;
- guarda el token en `mobile_push_tokens` con RLS por usuario.

En Expo Go o sin `EAS projectId`, la app no rompe: muestra que el permiso esta listo pero falta configurar EAS. El envio remoto se conectara desde backend/Edge Function cuando tengamos proyecto Expo/EAS definitivo.

## Play Store

Para publicar en Google Play necesitaremos:

- Cuenta Google Play Console.
- Package name: `com.globaltech.wiahost`.
- Icono final y splash screen final.
- Capturas por formato.
- Politica de privacidad.
- Declaracion de datos.
- Testing interno.
- Build `.aab` con EAS Build.

Comandos previstos:

```bash
cd apps/mobile
pnpm start
eas build --profile preview --platform android
eas build --profile production --platform android
eas submit --profile production --platform android
```

El proyecto ya incluye `apps/mobile/eas.json` con perfiles `development`, `preview` y `production`. El perfil `production` genera `.aab`, que es el formato esperado por Play Store.
