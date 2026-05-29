# Roadmap del piloto WIA -> WIAHost

Última actualización: 2026-05-29

## Objetivo

Migrar World Institutional Assets desde una operativa apoyada en Hostaway hacia WIAHost sin romper la web actual, sin perder reservas y sin usar iCal como vía de migración.

La primera meta no es sustituir todo Hostaway de golpe. La primera meta es que la web de WIA pueda consultar disponibilidad, mostrar propiedades y generar solicitudes/reservas contra WIAHost. Después se mantiene coexistencia con Hostaway mientras WIAHost absorbe inventario, reservas y canales externos.

WIA no es el límite del producto. WIA es el primer caso real para construir una Partner Website API que sirva a cualquier web externa: misma API, distinto `partnerId`, distintas credenciales y distinto mapping de anuncios.

## Principios

- La web pública de WIA no cambia visualmente salvo decisión explícita.
- Producción no se toca hasta validar local y preproducción.
- Hostaway sigue protegiendo Airbnb, Booking, Vrbo y otros canales hasta que WIAHost pueda asumirlos.
- iCal queda fuera del piloto: si no hay API, XML, webhook o bridge aprobado, el canal espera.
- Todo evento externo debe ser idempotente para evitar reservas, mensajes o bloqueos duplicados.
- Nada debe quedar hardcodeado para WIA salvo el seed y la configuración del piloto.
- Cualquier web debe poder conservar su diseño y usar WIAHost como backend operativo.
- Cada fase debe tener una prueba visible en local.
- Cada paso hacia producción debe tener rollback.

## Arquitectura objetivo

```text
Web WIA
  -> WIAHost Partner API
  -> WIAHost Core
  -> Reservas, leads, huéspedes, disponibilidad, pagos, tareas

Cualquier web externa
  -> WIAHost Partner Website API
  -> WIAHost Core
  -> Mismo contrato, otro partnerId y otras credenciales

Hostaway durante transición
  -> Hostaway Bridge
  -> WIAHost Core

Canales futuros
  -> Booking.com API/XML
  -> Airbnb API partner o bridge aprobado
  -> Vrbo connectivity provider/API
  -> Google Vacation Rentals
```

WIAHost debe ser el centro:

```text
Propiedades
Reservas
Disponibilidad
Precios
Mensajes
Pagos
Limpieza
Propietarios
Reporting
Auditoría
```

## Estado actual local

Ya existe una primera conexión local:

```text
WIA local
  http://localhost:5500

WIAHost local
  http://localhost:3002

Supabase local
  http://127.0.0.1:54321
```

La web WIA local puede llamar a WIAHost local con:

```env
BOOKING_PROVIDER=wiahost
WIAHOST_BASE_URL=http://localhost:3002
WIAHOST_BOOKING_ENGINE_URL=http://localhost:3002
WIAHOST_PARTNER_ID=worldinstitutionalassets
WIAHOST_PARTNER_API_KEY=<clave local solo backend>
```

Propiedades cargadas en local:

| Hostaway ID | Slug WIAHost | Nombre |
| --- | --- | --- |
| 419018 | `enjoy-your-vacation-by-the-sea` | Enjoy your vacation by the sea |
| 419019 | `chalet-madrid-aeropuerto` | Chalet vanguardista de diseño en Madrid aeropuerto |
| 419020 | `exclusive-villa-north-madrid` | Exclusive Villa North Madrid |

Página local de seguimiento:

```text
http://localhost:3002/wia-roadmap
```

Pantalla local de webs externas conectadas:

```text
http://localhost:3002/partner-apps
```

Prueba web local:

```text
http://localhost:5500/booking.html?checkIn=2026-07-01&checkOut=2026-07-05&guests=2
```

Prueba API local desde WIA:

```text
http://localhost:5500/api/hostaway/search?checkIn=2026-07-01&checkOut=2026-07-05&guests=2
```

Prueba cerrada local automatizada:

```text
pnpm wia:demo:local
```

El endpoint directo de WIAHost (`/api/public/v1/...`) ya no está abierto en local cuando la partner app está activa: sin `x-wiahost-partner-key` debe devolver `401`.

Prueba de estado de solicitud:

```text
http://localhost:3002/api/public/v1/reservations/{externalId}?partner=worldinstitutionalassets
```

Guía de integración genérica:

```text
docs/PARTNER_WEBSITE_INTEGRATION.md
```

## Fases

## Fase 0. Base local y aislamiento de producción

Objetivo: trabajar sin tocar la web real ni Hostaway.

Entregables:

- Rama de WIAHost para Partner API.
- Rama de WIA para migración.
- Web WIA local apuntando a WIAHost local.
- Producción intacta con Hostaway.
- Rollback por variable `BOOKING_PROVIDER=hostaway`.

Prueba visible en local:

- Abrir `http://localhost:5500`.
- Abrir `http://localhost:3002`.
- Confirmar que la web real sigue sin tocarse.

Estado: completada.

## Fase 1. Inventario WIA en WIAHost local

Objetivo: cargar las propiedades que hoy muestra la web de WIA desde Hostaway.

Entregables:

- Script `pnpm wia:seed:local`.
- Tres propiedades reales de WIA en Supabase local.
- API pública con `thumbnailUrl`, `amenities`, `externalListingId` y `partnerId`.
- Filtro `partner=worldinstitutionalassets`.

Prueba visible en local:

- `GET /api/public/v1/listings?partner=worldinstitutionalassets` devuelve 3 resultados.
- `GET /api/public/v1/availability?...&partner=worldinstitutionalassets` devuelve 3 resultados disponibles para fechas válidas.
- La web WIA local pinta las 3 propiedades con fotos.

Estado: completada.

## Fase 2. Partner API seria para webs externas

Objetivo: convertir la API inicial en una API reutilizable y segura para cualquier web externa.

Entregables:

- Resolución de partner app por entorno.
- Soporte para `x-wiahost-partner-key` o `Authorization: Bearer` cuando haya claves configuradas.
- Modelo `partner_apps` en base de datos con clave hasheada, dominios permitidos, URLs de retorno, webhooks y scopes.
- `Idempotency-Key` implementado en `POST /api/public/v1/inquiries`.
- Reintentos de la misma solicitud devuelven el mismo `reservationId` sin duplicar lead.
- Modelo de partner apps.
- Claves de API por partner, sin guardar secretos en claro.
- Autenticación server-to-server por bearer token o firma HMAC.
- Rate limit por partner.
- Idempotencia por `Idempotency-Key`.
- Endpoints versionados:
  - `GET /api/public/v1/listings`
  - `GET /api/public/v1/availability`
  - `POST /api/public/v1/inquiries`
  - `POST /api/public/v1/reservations`
  - `GET /api/public/v1/reservations/:externalId`
  - `POST /api/public/v1/messages`
- Errores normalizados para permisos, disponibilidad, validación y mapping.
- Guía de integración para cualquier web externa, no solo WIA.

Prueba visible en local:

- La web WIA local consulta disponibilidad desde WIAHost.
- La API devuelve `authMode=local_unsecured` en local si no se han configurado claves.
- Si se configura `WIAHOST_PUBLIC_API_KEYS`, la API exige clave válida.
- Si existe una `partner_app` activa en base de datos, la API valida la clave contra `key_hash`.
- Un formulario enviado desde el flujo WIA local -> WIAHost local crea un lead visible en `/leads`.
- Una llamada repetida con la misma clave idempotente no duplica el lead.
- `GET /api/public/v1/reservations/:externalId` devuelve el estado del lead/reserva creado por esa clave externa.
- Vitest cubre resolución de partner, claves, `externalReservationId` y endpoint público de estado.
- La documentación define el contrato reusable para cualquier web: `partnerId`, API key, mapping, idempotencia y estado.
- `/partner-apps` muestra la partner app de World Institutional Assets en local para operadores autenticados.
- La Partner Website API aplica rate limit por partner usando `rate_limit_per_minute`.
- La partner app local de WIA está activa y WIA local envía su clave desde backend.
- `pnpm wia:demo:local` valida WIA local -> WIAHost local: búsqueda autorizada desde WIA, rechazo 401 sin clave, creación de inquiry y consulta de estado por `externalId`.
- El lead creado desde la prueba local se puede preparar para pago y confirmar desde `/leads`, dejando eventos outbound en `channel_sync_events`.

Estado: en curso; flujo local WIA cerrado para Partner API, pendiente de preproducción.

## Fase 3. Motor de reserva directa WIAHost

Objetivo: cerrar el flujo de búsqueda, solicitud, bloqueo y pago desde WIAHost.

Entregables:

- Página `/book/[slug]` preparada para WIA.
- Creación de lead o reserva desde el motor.
- Validación anti-overbooking antes de confirmar.
- Lead visible en `/leads`.
- Reserva visible en `/reservations` cuando se confirme.
- Pago test con Stripe si se decide cobrar antes de confirmar.

Prueba visible en local:

- Desde WIA local se pulsa una propiedad.
- Se abre WIAHost local en `/book/[slug]`.
- Se envía una solicitud.
- El lead aparece en WIAHost.
- Desde `/leads` se prepara el pago del lead directo.
- Al confirmar el lead, la reserva pasa a `confirmed` y se crea un evento outbound `direct_reservation_confirmed` en modo simulación local.

Estado: en curso.

## Fase 4. Hostaway Bridge read-only

Objetivo: leer Hostaway sin escribir todavía.

Entregables:

- Credenciales Hostaway guardadas en entorno seguro.
- Importador de listings.
- Importador de reservas futuras.
- Importador de bloqueos y calendario.
- Importador de precios si la API lo permite.
- Webhook receiver para reservas y mensajes.
- Panel de discrepancias Hostaway vs WIAHost.

Prueba visible en local:

- Un import local o de preproducción muestra datos reales de Hostaway.
- El panel compara WIAHost con Hostaway.
- Los eventos duplicados no crean registros duplicados.

Estado: planificada.

## Fase 5. Coexistencia WIAHost -> Hostaway

Objetivo: si Hostaway sigue conectado a Airbnb, Booking y Vrbo, WIAHost debe reflejar las reservas directas nuevas en Hostaway.

Entregables:

- Cola de sincronización saliente.
- Adapter Hostaway en modo escritura controlada.
- Registro en `channel_sync_events`.
- Estados `pending`, `succeeded`, `failed`, `retrying`, `needs_review`.
- Alertas cuando Hostaway rechace una reserva.

Prueba visible en local:

- Adapter fake simula Hostaway.
- Crear una reserva en WIAHost genera un evento outbound.
- Si el adapter falla, aparece como `needs_review`.

Estado: planificada.

## Fase 6. Preproducción WIA

Objetivo: repetir todo el flujo local en un entorno público y revisable por tu amigo.

Entregables:

- WIAHost preproducción.
- Web WIA staging apuntando a WIAHost pre.
- Base de datos pre con propiedades reales.
- Variables de entorno de pre.
- Checklist de búsqueda, lead, reserva, pago, mensajes y disponibilidad.

Prueba visible:

- Tu amigo abre la web staging.
- Busca fechas.
- Ve propiedades desde WIAHost.
- Envía solicitud.
- El equipo ve el lead en WIAHost pre.

Estado: planificada.

## Fase 7. Corte controlado de producción

Objetivo: mover la web real de WIA a WIAHost.

Entregables:

- Ventana de corte.
- Variables de producción configuradas.
- Monitor 24/48h.
- Rollback probado.
- Checklist de soporte.

Prueba visible:

- La web real busca contra WIAHost.
- Las solicitudes entran en WIAHost.
- Hostaway sigue cubriendo OTAs si todavía no se han migrado.

Estado: planificada.

## Fase 8. Channel manager API-first

Objetivo: empezar a sustituir Hostaway como channel manager sin usar sincronización iCal.

Orden recomendado:

1. Booking.com Connectivity API/XML.
2. Airbnb API partner o bridge PMS aprobado.
3. Vrbo connectivity provider/API.
4. Google Vacation Rentals.
5. Otros canales.

Entregables:

- Adapter interface por canal.
- Mapping por canal: property ID, listing ID, room ID, rate plan ID.
- Pull de reservas.
- Push de disponibilidad.
- Push de precios cuando el canal lo permita.
- Inbox por API cuando el canal lo permita.
- Health check por canal.
- Auditoría y retry por sync.

Prueba visible en local:

- Adapters fake para simular Booking, Airbnb y Vrbo.
- Eventos entrantes normalizados como reservas o mensajes.
- Eventos salientes auditados antes de tocar canales reales.

Estado: planificada.

## Qué no vamos a hacer

- No vamos a usar iCal en este piloto, ni como fallback.
- No vamos a hacer scraping de Airbnb, Booking ni Vrbo.
- No vamos a pedir credenciales personales para automatizar navegadores.
- No vamos a cortar Hostaway antes de tener coexistencia y rollback.
- No vamos a mezclar datos de partners distintos.

## Próximo bloque de trabajo

Fase activa: Fase 2/3 local, antes de preproducción.

Tareas inmediatas:

1. Reactivar el proyecto Supabase staging actual o sustituir `.env.staging.local` por un nuevo proyecto Supabase pre.
2. Aplicar `0009_partner_apps.sql` en preproducción y crear la partner app de WIA con clave real.
3. Añadir rotación de claves desde `/partner-apps`, con doble clave activa durante una ventana controlada.
4. Separar formalmente inquiries de reservations si decidimos que los leads no deben vivir como reservation status inquiry.
5. Convertir `pnpm wia:demo:local` en prueba e2e de CI/preproducción cuando el staging vuelva a tener base de datos sana.
6. Preparar el mismo flujo en preproducción.

## Bitácora

- 2026-05-29: creada conexión local WIA -> WIAHost.
- 2026-05-29: cargadas 3 propiedades reales desde la respuesta pública actual de WIA/Hostaway.
- 2026-05-29: añadida página local `/wia-roadmap`.
- 2026-05-29: fijado criterio API-first; iCal queda excluido incluso como fallback.
- 2026-05-29: iniciada Fase 2 con resolución de partner y claves API opcionales por entorno.
- 2026-05-29: añadida idempotencia en `POST /api/public/v1/inquiries`.
- 2026-05-29: validado flujo WIA local -> WIAHost local -> `/leads`.
- 2026-05-29: añadido `GET /api/public/v1/reservations/:externalId` para consultar el estado de solicitudes creadas desde una web externa.
- 2026-05-29: añadidas pruebas unitarias para resolución de partner, claves, external IDs y consulta pública de estado.
- 2026-05-29: documentado el modelo Partner Website API para conectar cualquier web a WIAHost sin acoplarla a WIA.
- 2026-05-29: añadido modelo `partner_apps` para que las webs conectadas tengan credenciales y configuración persistidas.
- 2026-05-29: validado en Supabase local que una `partner_app` activa exige clave y devuelve `authMode=partner_app` con credencial válida.
- 2026-05-29: añadida y validada la pantalla interna `/partner-apps` para gestionar webs externas conectadas a WIAHost.
- 2026-05-29: añadido rate limit por partner en la Partner Website API.
- 2026-05-29: comprobada preproducción; Vercel staging responde, pero `/api/health` devuelve 503 porque Supabase staging no responde correctamente.
- 2026-05-29: endurecido el montaje local; WIAHost exige clave de partner y WIA local la envía desde backend.
- 2026-05-29: añadido `pnpm wia:demo:local` para validar el flujo WIA local -> WIAHost local sin imprimir secretos.
- 2026-05-29: confirmado en local un lead creado por la Partner API; quedó pago `direct_checkout` pendiente y sync outbound simulado `direct_reservation_confirmed`.
