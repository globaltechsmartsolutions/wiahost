# Integración de cualquier web con WIAHost

Última actualización: 2026-05-29

## Principio

WIAHost no debe estar acoplado a la web de World Institutional Assets. WIA es el primer piloto real, pero la arquitectura correcta es que cualquier web externa pueda usar WIAHost como backend operativo de alojamientos.

El objetivo es que una web pueda mantener su diseño, su dominio y su experiencia visual, mientras WIAHost gestiona lo difícil:

- Inventario.
- Disponibilidad.
- Leads y reservas.
- Huéspedes.
- Mensajes.
- Pagos.
- Bloqueos anti-overbooking.
- Auditoría.
- Sincronización futura con canales.

## Modelo mental

```text
Cualquier web externa
  -> WIAHost Partner Website API
  -> WIAHost Core
  -> Propiedades, disponibilidad, leads, reservas, pagos y mensajes
```

Cada web conectada se trata como una `partner app`.

```text
partnerId: worldinstitutionalassets
apiKey: clave privada server-to-server
externalListingId: ID de la web o del sistema anterior
propertyListingId: anuncio interno WIAHost
externalReservationId: ID idempotente de la solicitud externa
```

## Formas de integración

### 1. API headless server-to-server

Es la opción más seria para webs con backend propio.

La web controla toda la interfaz y su servidor llama a WIAHost:

- `GET /api/public/v1/listings`
- `GET /api/public/v1/availability`
- `POST /api/public/v1/inquiries`
- `GET /api/public/v1/reservations/:externalId`
- `POST /api/public/v1/reservations` cuando formalicemos reserva confirmada
- `POST /api/public/v1/messages` cuando abramos mensajería pública

La clave del partner nunca debe vivir en el navegador. Debe usarse desde el backend de la web.

### 2. Redirección al motor de reserva WIAHost

Es la opción más rápida.

La web muestra propiedades y disponibilidad, pero el botón final abre:

```text
https://app.wiahost.com/book/{publicSlug}?checkIn=...&checkOut=...&guests=...
```

Ventaja: menos riesgo, porque el formulario, validación y lead viven en WIAHost.

### 3. Widget embebible futuro

Para webs sin equipo técnico o sin backend.

WIAHost podrá ofrecer un script o iframe configurable:

```html
<script
  src="https://app.wiahost.com/embed/booking.js"
  data-partner="worldinstitutionalassets"
></script>
```

Esta opción debe esperar a que la API base sea sólida. Primero API, después widget.

### 4. Web clonada o staging de migración

Para migraciones delicadas, se puede levantar una copia de la web en staging, conectarla a WIAHost y validar todo antes de tocar producción.

Esto es lo que estamos haciendo con WIA:

```text
WIA local -> WIAHost local -> preproducción -> producción
```

## Contrato mínimo por partner

Cada web externa necesita:

- `partnerId`: identificador estable de la web/cliente.
- API key privada o firma HMAC.
- Dominios permitidos para origen y redirecciones.
- Mapeo de anuncios externos a listings WIAHost.
- Política de lead vs reserva confirmada.
- Moneda, idioma y país por defecto.
- URLs de retorno si hay checkout.
- Webhook URL opcional para notificar cambios.

## Modelo persistido

El camino de producto es guardar cada web conectada en `public.partner_apps`.

Campos principales:

- `partner_id`: identificador público estable.
- `display_name`: nombre humano de la web o partner.
- `status`: `draft`, `active`, `paused` o `revoked`.
- `key_hash`: hash SHA-256 de la clave privada. La clave real no se guarda.
- `key_prefix`: prefijo corto para soporte y rotación.
- `allowed_origins`: dominios permitidos.
- `redirect_urls`: URLs válidas de retorno.
- `webhook_url`: endpoint externo opcional.
- `scopes`: permisos concedidos.
- `rate_limit_per_minute`: límite operativo por partner.

Durante la transición, `WIAHOST_PUBLIC_API_KEYS` sigue existiendo como fallback local/dev, pero no es el camino final de producto.

## Reglas técnicas

- Nada debe depender del nombre `worldinstitutionalassets` salvo el seed o configuración del piloto.
- La API debe ser versionada: `/api/public/v1/...`.
- Toda creación externa debe ser idempotente con `Idempotency-Key`.
- Toda respuesta debe llevar errores consistentes.
- Las credenciales de un partner no pueden leer datos de otro.
- El diseño de la web externa no debe cambiar salvo que el cliente quiera.
- WIAHost debe poder operar aunque la web externa solo cree leads, sin pagos.
- Las partner apps y sus claves deben gestionarse desde WIAHost, no desde código hardcodeado.

## Estado local actual

Ya está validado en local:

```text
GET /api/public/v1/listings?partner=worldinstitutionalassets
GET /api/public/v1/availability?...&partner=worldinstitutionalassets
POST /api/public/v1/inquiries
GET /api/public/v1/reservations/:externalId
```

También está probado:

- Resolución de partner.
- API key por header o bearer token.
- Partner apps persistidas en base de datos mediante hash de clave.
- Pantalla interna `/partner-apps` para crear, editar, pausar y documentar webs conectadas.
- Rate limit por partner usando `rate_limit_per_minute`.
- `Idempotency-Key`.
- Reintento sin duplicar lead.
- Consulta de estado por external ID.
- Tests unitarios de Partner API.

Prueba con clave persistida:

```powershell
curl.exe -H "x-wiahost-partner-key: <clave-privada>" `
  "http://localhost:3002/api/public/v1/listings?partner=worldinstitutionalassets"
```

Respuesta esperada:

```json
{
  "authMode": "partner_app",
  "ok": true,
  "partner": "worldinstitutionalassets"
}
```

## Qué queda para que sea producto reutilizable

1. Aplicar la migración `0009_partner_apps.sql` en preproducción.
2. Añadir rotación de claves y doble clave activa durante ventana de cambio.
3. Añadir HMAC opcional para integraciones sensibles.
4. Formalizar `POST /api/public/v1/reservations`.
5. Añadir webhooks salientes hacia la web externa.
6. Publicar documentación para clientes técnicos.
7. Crear un SDK pequeño de JavaScript/TypeScript.
8. Crear widget embebible solo cuando la API esté estable.

## Qué no vamos a hacer

- No hardcodear WIA como si fuese el único cliente.
- No exponer claves privadas en navegador.
- No depender de Hostaway para que una web externa use WIAHost.
- No usar iCal como fallback.
- No hacer scraping ni automatización no autorizada de canales.
