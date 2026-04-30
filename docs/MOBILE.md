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
- Subida de evidencias desde camara, galeria o selector PDF/documento en activos, incidencias y tareas, usando Supabase Storage y registros en `documents`.
- Previsualizacion movil de evidencias guardadas con miniatura para imagenes, etiqueta PDF/DOC y apertura mediante URL firmada temporal.
- Registro de dispositivo para push notifications desde Ajustes, con permisos nativos, canal Android `operations` y guardado en `mobile_push_tokens`.
- Envio servidor de push notifications mediante `/api/notifications/push`, con auditoria en `push_notification_deliveries`.
- Disparadores push automaticos para mensajes entrantes, reservas relevantes, tareas prioritarias e incidencias operativas. Son no bloqueantes: si Expo falla, la escritura principal sigue adelante.
- Login y registro con Supabase Auth.
- Persistencia de sesion con `@react-native-async-storage/async-storage`.
- TanStack Query para cache y refresco de datos operativos.
- Offline read-only para dashboard/listas principales y fichas de activo, reserva, conversacion, tarea e incidencia: guarda la ultima respuesta viva en AsyncStorage y la muestra con banner si falla la red.
- Conexion directa a Supabase con RLS.
- Fallback demo si no hay variables `EXPO_PUBLIC_*`, para poder revisar la experiencia sin romper el arranque.
- NativeWind preparado para evolucionar UI movil sin bloquear el MVP actual. La UI actual usa `StyleSheet`; `withNativeWind` en Metro queda para una pasada especifica porque en Windows/Node 24 rompia `expo export`.
- TypeScript strict y scripts `typecheck`, `lint`, `build` y `test`.
- E2E mobile con Maestro en `apps/mobile/e2e`: suite demo por defecto y suite conectada para login, alta de activo/incidencia y cambios de estado reales en incidencia, tarea y reserva con Supabase.
- EAS preparado para Android e iOS. Android genera APK/AAB; iOS genera build de simulador o `.ipa` firmado para TestFlight/App Store, nunca APK.
- Las fichas de activo, tarea e incidencia conservan evidencias/documentos recientes en cache offline read-only para que el equipo pueda revisar contexto aunque se caiga la conexion.

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
pnpm test:mobile:e2e
pnpm test:mobile:e2e:connected
```

CI ejecuta `pnpm build:mobile` y `expo export --platform web` como guardarrail ligero hasta que se configure EAS Build.

Los comandos EAS estan disponibles desde la raiz:

```bash
pnpm eas:login
pnpm eas:configure
pnpm eas:build:android:preview
pnpm eas:build:android:production
pnpm eas:build:ios:simulator
pnpm eas:build:ios:preview
pnpm eas:build:ios:production
pnpm eas:submit:android:internal
pnpm eas:submit:ios
```

La guia operativa completa esta en `docs/EAS_BUILD.md`.

`pnpm test:mobile:e2e` requiere Maestro CLI y un dispositivo/emulador con la app instalada. Ejecuta la suite demo contra un APK sin variables Supabase.

`pnpm test:mobile:e2e:connected` requiere un APK/dev build apuntando a Supabase y las variables `WIAHOST_EMAIL` y `WIAHOST_PASSWORD` en el entorno local. Esta suite crea datos reales de QA.

## Funciones prioritarias siguientes

- Extender offline read-only a cola de tareas del dia y documentos/evidencias recientes.
- Anadir flujos Maestro conectados para subida de evidencia, registro push y cambios de estado reales.

## Push notifications

La app movil usa `expo-notifications` y `expo-device`. Desde `/settings`, el usuario puede activar avisos. El flujo:

- pide permiso nativo de notificaciones;
- crea canal Android `operations`;
- obtiene `ExpoPushToken` si existe `EAS projectId`;
- guarda el token en `mobile_push_tokens` con RLS por usuario.

En Expo Go o sin `EAS projectId`, la app no rompe: muestra que el permiso esta listo pero falta configurar EAS.

El backend web ya expone `POST /api/notifications/push` para que operadores/admins creen una notificacion interna y la envien al dispositivo movil del usuario destino. El endpoint valida sesion, rol, payload Zod, lee `mobile_push_tokens`, envia a Expo Push Service y deja trazabilidad por dispositivo en `push_notification_deliveries`.

Ademas, `apps/web/src/lib/services/operational-push.ts` centraliza los disparadores automaticos. Las operaciones de reservas, tareas, incidencias y mensajes entrantes llaman a esta capa tras guardar datos y eventos de auditoria. El envio se hace con `Promise.allSettled` y captura de errores para que una caida temporal de Expo no bloquee la operacion de negocio.

Si se activa seguridad reforzada de Expo Push Service en EAS, configurar `EXPO_ACCESS_TOKEN` solo en servidor (`apps/web/.env.local` o variables de Vercel). Nunca va en `apps/mobile/.env`.

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

## iOS / TestFlight

iOS no usa APK. Opciones:

- Simulador: `pnpm eas:build:ios:simulator`.
- iPhone real interno: `pnpm eas:build:ios:preview`, requiere Apple Developer.
- TestFlight/App Store: `pnpm eas:build:ios:production` y despues `pnpm eas:submit:ios`.

El identificador iOS configurado es `com.globaltech.wiahost`. Para publicar necesitaremos Apple Developer Program activo, app creada en App Store Connect, politica de privacidad, capturas, icono final y declaracion de datos.
