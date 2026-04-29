# Mobile

## Objetivo

WIAHost tiene app movil real con Expo React Native en `apps/mobile`. No es una WebView: comparte backend, auth, tipos y validaciones con la web, pero la UI es nativa y esta pensada para operacion rapida desde el movil.

## Estado actual

- App Expo creada en `apps/mobile`.
- Expo Router con tabs moviles: Dashboard, Activos, Reservas, Inbox, Riesgo y Ajustes.
- Login y registro con Supabase Auth.
- Persistencia de sesion con `@react-native-async-storage/async-storage`.
- TanStack Query para cache y refresco de datos operativos.
- Conexion directa a Supabase con RLS.
- Fallback demo si no hay variables `EXPO_PUBLIC_*`, para poder revisar la experiencia sin romper el arranque.
- NativeWind configurado para evolucionar UI movil sin bloquear el MVP actual.
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
```

## Funciones prioritarias siguientes

- Formularios nativos para crear/editar propiedades.
- Detalle de reserva, tarea, incidencia y conversacion.
- Envio de mensajes desde inbox movil.
- Subida de fotos/evidencias desde camara o galeria.
- Push notifications para check-in, SLA de inbox e incidencias.
- Offline read-only basico para tareas del dia.

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
pnpm --filter mobile start
eas build --platform android
eas submit --platform android
```
