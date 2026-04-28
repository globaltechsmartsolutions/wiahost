# Mobile y Play Store

## Objetivo

WIAHost debe poder convertirse en app movil descargable desde Google Play Store y, mas adelante, App Store.

La app movil debe ser React Native real con Expo, no una WebView.

## Arquitectura prevista

```text
apps/
  web/
  mobile/   futuro
packages/
  shared/
  database/
supabase/
```

La app movil usara Supabase Auth, Supabase Postgres, RLS, `packages/shared` y `packages/database`.

## Funciones moviles prioritarias

- Login.
- Dashboard resumido.
- Reservas de hoy.
- Multi-calendario responsive.
- Inbox y notificaciones.
- Tareas de limpieza.
- Incidencias.
- Checklist.
- Subida de fotos/evidencias.
- Perfil y ajustes.

## Play Store

Para publicar en Play Store necesitaremos:

- Cuenta Google Play Console.
- Nombre de paquete, por ejemplo `com.globaltech.wiahost`.
- Icono de app.
- Splash screen.
- Capturas.
- Politica de privacidad.
- Declaracion de datos.
- Testing interno.
- Build `.aab` generado con EAS Build.

## Comandos futuros previstos

```bash
pnpm --filter mobile start
eas build --platform android
eas submit --platform android
```
