# Roadmap de integraciones API y Channel Manager

## Objetivo

Convertir WIAHost en el centro operativo de las viviendas, igual que un PMS/channel manager profesional:

- Una vivienda se gestiona una vez en WIAHost.
- La disponibilidad, reservas, precios, mensajes y tareas se sincronizan con canales externos.
- Cada canal se conecta con el nivel tecnico que permita: API, XML, webhooks, iCal o integracion via PMS intermedio.
- WIAHost mantiene trazabilidad, auditoria, anti-overbooking y control humano antes de automatizar cambios sensibles.

## Principio rector

No vamos a conectar todos los canales a la vez. Primero construiremos una base comun y despues conectaremos canales uno por uno.

La situacion real del primer piloto es especial:

- El socio ya opera su web conectada a Hostaway.
- Hostaway hoy funciona como PMS/channel manager maestro.
- WIAHost debe migrar esa operativa sin cortar de golpe Airbnb, Booking, Vrbo ni la web actual.
- La primera conexion no es una OTA: es una migracion desde Hostaway + una API generica para webs externas.

Cada integracion debe pasar por este flujo:

```text
Canal externo -> Adapter -> Normalizacion -> Core WIAHost -> Auditoria -> UI/Automatizaciones
Core WIAHost -> Sync Queue -> Adapter -> Canal externo -> Resultado/Auditoria
```

## Vision global

### Core interno de WIAHost

Este core debe ser independiente del canal:

- `properties`: activo interno.
- `property_listings`: anuncio por canal.
- `channel_accounts`: cuenta externa conectada.
- `channel_listings`: mapping entre vivienda interna y listing externo.
- `reservations`: reserva normalizada.
- `calendar_blocks`: bloqueos importados/manuales.
- `conversation_messages`: inbox normalizado.
- `pricing_observations`: precios/recomendaciones.
- `channel_sync_events`: historial de sincronizacion.
- `operational_events`: auditoria operativa.

### Dos capas distintas que no debemos mezclar

1. **Hostaway Bridge**

   Sirve para leer y, si hace falta durante la transicion, escribir en Hostaway usando su Public API y webhooks. Es una integracion temporal o de coexistencia.

2. **WIAHost Partner Channel API**

   Es nuestra API propia, equivalente al "Partner Channel" de Hostaway. Sirve para que cualquier web/app externa cree reservas, mande mensajes y consulte disponibilidad en WIAHost.

La web del socio sera el primer cliente de nuestra Partner Channel API, pero la API debe valer para cualquier web futura.

### Adaptadores por canal

Cada canal tendra su propio adapter:

- `direct`: web propia / booking engine.
- `partner_app`: cualquier web/app externa que quiera usar WIAHost como backend operativo.
- `hostaway_bridge`: migracion/coexistencia con Hostaway Public API.
- `airbnb`: API partner cuando exista acceso; iCal como puente.
- `booking`: Booking.com Connectivity APIs/XML cuando exista acceso.
- `vrbo`: Vrbo connectivity provider/API cuando exista acceso.
- `expedia`: futuro.
- `google_vacation_rentals`: futuro.
- `pms_bridge`: Hostaway/Guesty/Lodgify/Smoobu si el cliente ya usa uno.

Cada adapter debe implementar, si el canal lo permite:

- `pullListings`
- `pushListingContent`
- `pullReservations`
- `pushAvailability`
- `pushRates`
- `pullMessages`
- `sendMessage`
- `handleWebhook`
- `healthCheck`

No todos los canales soportan todas las funciones.

## Realidad de APIs por canal

### Airbnb

Acceso API completo normalmente requiere pertenecer al programa de software partners/API program. No debe usarse scraping ni automatizacion de navegador.

Prioridad:

1. iCal import/export para disponibilidad.
2. Preparar adapter Airbnb con contrato interno.
3. Solicitar acceso partner o conectar mediante PMS existente si el cliente ya usa uno.
4. Activar reservas/mensajes/precios por API cuando haya autorizacion.

Limitaciones esperables:

- Email real del huesped puede no estar disponible.
- Algunas URLs o datos externos pueden estar restringidos en mensajes.
- Historial previo puede no importarse completo.
- Puede haber reglas de contenido, pricing y promociones especificas.

### Booking.com

Booking.com ofrece Connectivity APIs/XML para connectivity partners y channel managers.

Prioridad:

1. Mapping de property ID, room ID y rate plan ID.
2. Importar reservas futuras.
3. Push de disponibilidad y precios.
4. Mensajes post-reserva cuando la API lo permita.
5. Gestion de errores y discrepancias visibles en UI.

Limitaciones esperables:

- Datos personales limitados por GDPR.
- Mensajes historicos o inquiries pueden no estar completos.
- Restricciones/promociones pueden seguir requiriendo Extranet.
- Hay que revisar rates tanto en WIAHost como en Booking durante el piloto.

### Vrbo

Vrbo funciona mediante connectivity providers/integrated property managers. La integracion puede implicar que WIAHost sea el sistema maestro para listings integrados.

Prioridad:

1. iCal como puente inicial.
2. Preparar mapping y checklist de cuenta.
3. Conectar por provider/API cuando haya aprobacion.
4. Activar mensajes y pagos solo cuando el flujo este claro.

Limitaciones esperables:

- Puede requerir payment processor configurado.
- Reservas anteriores a la conexion pueden tener que recrearse manualmente.
- El inbox/calendario del canal puede dejar de ser el lugar correcto para operar una vez integrado.

### Web directa

Es el canal que controlamos al 100%.

Prioridad:

1. Booking engine publico.
2. Disponibilidad real desde WIAHost.
3. Leads y reservas directas.
4. Pago test/Stripe.
5. Mensajes en WIAHost.
6. iCal export para bloquear otros canales.

Este canal debe ser nuestro primer caso de uso real porque no depende de permisos externos.

### Hostaway Bridge

Es la capa de migracion desde el sistema actual del socio.

Objetivo:

- Importar listings, reservas, calendario, bloqueos y mensajes desde Hostaway.
- Suscribirse a webhooks de Hostaway para cambios en reservas y mensajes.
- Comparar Hostaway vs WIAHost para detectar discrepancias.
- Mantener Hostaway como source of truth durante la fase de coexistencia.
- Opcionalmente, crear reservas en Hostaway desde WIAHost mientras Hostaway siga bloqueando Airbnb/Booking/Vrbo.

Regla tecnica:

- Hostaway Bridge no es nuestro producto final; es un puente de migracion y reduccion de riesgo.
- Si la web del socio empieza a crear reservas en WIAHost antes de migrar OTAs, WIAHost debe reflejar esas reservas en Hostaway para que Hostaway siga bloqueando canales externos.
- Todo evento Hostaway debe ser idempotente: un webhook repetido o desordenado nunca debe duplicar reservas/mensajes.

Asi evitamos un corte brusco y podemos probar WIAHost con casas reales sin perder la proteccion actual de Hostaway.

### Partner app / cualquier web

Es la primera integracion API que vamos a construir. Aunque el primer cliente sea la web/app del socio, no debe quedar acoplada a esa web.

Objetivo:

- Cualquier web externa puede consultar disponibilidad.
- Cualquier web externa puede crear leads o reservas.
- Cualquier web externa puede enviar mensajes iniciales o actualizaciones.
- Cualquier web externa puede consultar estado de reserva/pago si tiene permisos.
- WIAHost mantiene el core: disponibilidad, anti-overbooking, auditoria, tareas, inbox y pagos.

Regla tecnica:

- El adapter se llama `partner_app`.
- En el core debe distinguirse de `direct` cuando el origen sea una web externa. Hostaway lo modela como Partner Channel y nosotros debemos mantener esa separacion.
- La identidad de la web concreta vive en `external_account_id`, `external_listing_id`, payload metadata y claves de API, no en el nombre del canal.

Asi evitamos hacer una integracion "para el socio" y construimos una API reutilizable para cualquier web.

## Fases de ejecucion

## Fase 0 - Auditoria de Hostaway actual

Objetivo: entender exactamente que tiene conectado el socio hoy antes de tocar nada.

Entregables:

- Inventario de viviendas/listings en Hostaway.
- Canales conectados por vivienda: Airbnb, Booking, Vrbo, web propia u otros.
- Tipo de conexion por canal: API, XML, iCal, manual o desconocida.
- Reservas futuras, bloqueos, tarifas, mensajes y automatizaciones actuales.
- Como la web del socio crea reservas hoy: widget, API, formulario, checkout, webhook o plugin.
- Riesgos de corte: pagos, mensajes, cancelaciones, calendario, limpieza, propietarios.

Criterio de salida:

- Sabemos que datos migrar primero.
- Sabemos que sistemas no podemos apagar todavia.
- Tenemos una lista de viviendas piloto y una vivienda de prueba sin alto riesgo.

## Fase 1 - Hostaway Bridge read-only

Objetivo: conectar WIAHost a Hostaway sin cambiar todavia la operativa real.

Entregables:

- Credenciales Hostaway Public API guardadas en entorno seguro.
- Import de listings/propiedades.
- Import de reservas futuras.
- Import de calendario/bloqueos.
- Import de mensajes si la API lo permite.
- Webhook receiver para eventos Hostaway: reserva creada, reserva actualizada y mensaje nuevo.
- Panel de discrepancias Hostaway vs WIAHost.
- Tests de webhooks duplicados/desordenados.

Criterio de salida:

- WIAHost refleja Hostaway con datos reales.
- No escribe todavia en Hostaway ni en OTAs.
- El equipo puede comparar ambos sistemas sin riesgo.

## Fase 2 - WIAHost Partner Channel API para la web del socio

Objetivo: que la web/app del socio deje de depender directamente de Hostaway y empiece a hablar con WIAHost, pero con una API reutilizable para cualquier web.

Entregables:

- API keys por partner app sin guardar secretos en claro.
- Endpoints publicos versionados:
  - `GET /api/public/v1/listings`
  - `GET /api/public/v1/availability`
  - `POST /api/public/v1/reservations`
  - `POST /api/public/v1/messages`
  - `GET /api/public/v1/reservations/:externalId`
- Firmas HMAC o bearer tokens server-to-server.
- Idempotencia por `Idempotency-Key` y `external_reservation_id`.
- Rate limit por partner app.
- Mapping de vivienda externa a `property_id`/`property_listing_id`.
- Errores consistentes para disponibilidad, permisos, mapping y validacion.

Criterio de salida:

- La web del socio puede crear leads/reservas en WIAHost.
- La misma API sirve para otra web cambiando credenciales y mappings.
- WIAHost bloquea solapes antes de crear reservas.
- Nada depende de codigo especifico del socio.

## Fase 3 - Coexistencia WIAHost -> Hostaway

Objetivo: si Hostaway sigue conectado a Airbnb/Booking/Vrbo, WIAHost debe reflejar reservas nuevas en Hostaway para que Hostaway siga bloqueando el resto de canales.

Entregables:

- Outbound sync WIAHost -> Hostaway para reservas creadas por Partner Channel.
- Sync de cancelaciones/cambios relevantes.
- Registro en `channel_sync_events`.
- Cola de reintentos y estado `needs_review`.
- Alertas si Hostaway no acepta una reserva o hay conflicto.

Criterio de salida:

- La web del socio puede apuntar a WIAHost.
- Hostaway sigue protegiendo los canales externos hasta que los migremos.
- Si falla la escritura a Hostaway, operaciones lo ve inmediatamente.

## Fase 4 - Cutover de la web del socio

Objetivo: mover la web real del socio a WIAHost.

Entregables:

- Entorno production/pilot estable.
- Prueba con una vivienda piloto.
- Prueba de reserva real o simulada end-to-end.
- Rollback documentado a Hostaway.
- Monitor 24/48h de errores, reservas y disponibilidad.

Criterio de salida:

- La web del socio funciona sobre WIAHost.
- Hostaway queda como puente para OTAs, no como destino principal de la web.
- No hay dobles reservas ni reservas perdidas.

## Fase 5 - Base channel manager interna completa

Objetivo: que WIAHost tenga una arquitectura preparada para APIs aunque todavia no tengamos todas las credenciales externas.

Entregables:

- Modelo canonico de canal, listing, reserva, mensaje, precio y sync event.
- Adapter interface TypeScript.
- Sync queue inicial con estados: `pending`, `running`, `succeeded`, `failed`, `retrying`, `needs_review`.
- Idempotencia por `external_id`, canal y tipo de evento.
- Auditoria de cada cambio entrante/saliente.
- Pantalla de conexiones por vivienda con salud, ultima sync y errores.
- Tests unitarios de normalizacion e idempotencia.

Criterio de salida:

- Podemos simular Airbnb/Booking/Vrbo con adapters fake sin tocar canales reales.
- Ningun evento duplicado crea doble reserva.
- Todo fallo queda visible en `channel_sync_events`.

## Fase 6 - Fallback iCal opcional

Objetivo: usar iCal solo como puente temporal si un canal externo no da acceso API a tiempo.

Entregables:

- Import iCal por vivienda/canal si hace falta.
- Export iCal por listing WIAHost si hace falta.
- Monitor de ultima importacion y errores.
- Alerta si un feed no actualiza.

Criterio de salida:

- iCal nunca bloquea el avance del core API-first.
- iCal no se usa para mensajes, pagos, precios complejos ni automatizaciones sensibles.

## Fase 7 - Booking.com API/XML

Objetivo: primera integracion API seria, porque Booking documenta Connectivity APIs de reservas, disponibilidad, rates y messaging.

Entregables:

- Solicitud/alta como connectivity partner o uso de cuenta/provider compatible.
- Mapping UI para `external_property_id`, `room_id`, `rate_plan_id`.
- Pull de reservas futuras.
- Push de availability/rates.
- Registro de errores por listing.
- Webhooks/polling segun permita Booking.
- Tests con sandbox/cuenta test si esta disponible.

Criterio de salida:

- Una vivienda piloto sincroniza reservas Booking -> WIAHost.
- Cambios de disponibilidad WIAHost -> Booking se reflejan correctamente.
- Errores de mapping/rates aparecen en UI sin romper el resto del sistema.

## Fase 8 - Airbnb API partner o bridge PMS

Objetivo: preparar la integracion Airbnb sin depender de caminos no oficiales.

Entregables:

- Adapter Airbnb preparado detras de feature flag.
- Documentacion de requisitos partner.
- Evaluacion de bridge PMS si el acceso directo tarda: Hostaway, Guesty, Lodgify, Smoobu u otro.
- Pull de listings/reservas/mensajes si API disponible.
- Push de availability/rates si API disponible.
- Politicas de mensajes y off-platform compliance.

Criterio de salida:

- Tenemos camino aprobado: API directa o PMS bridge.
- No se usa scraping ni credenciales compartidas inseguras.
- Los datos Airbnb quedan normalizados en el mismo core.

## Fase 9 - Vrbo API/connectivity provider

Objetivo: integrar Vrbo con una operativa segura y entendiendo que puede exigir WIAHost como maestro.

Entregables:

- Checklist de cuenta, pagos y listings.
- Mapping de listing externo.
- Pull de reservas.
- Push de availability/rates.
- Mensajeria si API disponible.
- Documentacion de cambios operativos para el equipo.

Criterio de salida:

- Una vivienda piloto sincroniza con Vrbo sin operar manualmente dos calendarios.
- Pagos, cancelaciones y mensajes tienen reglas claras.

## Fase 10 - Inbox unificado por API

Objetivo: que el equipo responda desde WIAHost.

Entregables:

- Modelo de conversacion multi-canal.
- Webhooks/polling por canal.
- Deduplicacion por `external_message_id`.
- Envio de mensajes por API cuando el canal lo permita.
- Fallback a email proxy/nota manual si no lo permite.
- Reglas de compliance por canal: URLs, telefono, email, adjuntos.
- Estados: `needs_reply`, `pending_guest`, `pending_channel`, `failed_delivery`.

Criterio de salida:

- Cada mensaje entrante queda en WIAHost.
- Cada respuesta muestra si fue enviada por API, email proxy o manual.
- Los fallos de entrega no se esconden.

## Fase 11 - Revenue y pricing sync

Objetivo: pasar de observaciones de precio a sincronizacion real.

Entregables:

- Precio base, minimo/noches, restricciones y ocupacion por propiedad.
- Integracion futura con PriceLabs/Beyond/Wheelhouse o motor propio.
- Push de rates por canal donde este soportado.
- Deteccion de discrepancias entre WIAHost y canal.
- Aprobacion humana antes de cambios masivos.

Criterio de salida:

- Podemos simular y auditar cada cambio de precio.
- Ninguna subida masiva se ejecuta sin preview.

## Fase 12 - Certificacion, escalado y producto SaaS

Objetivo: convertir WIAHost en channel manager serio.

Entregables:

- Multi-tenant fuerte.
- Vault/secrets por tenant/canal.
- OAuth o authorization flow por canal cuando aplique.
- Webhooks firmados y retry/backoff.
- Rate limiting por proveedor.
- Data retention y GDPR.
- Runbooks por canal.
- Monitor externo de sync.
- Panel de soporte interno.

Criterio de salida:

- Podemos operar varias cuentas/casas sin mezclar datos.
- Cada integracion tiene observabilidad, retry y rollback.

## Orden recomendado para el piloto de tu socio

1. Auditar Hostaway actual del socio.
2. Seleccionar 1 vivienda piloto de bajo riesgo.
3. Conectar Hostaway Bridge read-only.
4. Importar datos reales a WIAHost y comparar.
5. Construir Partner Channel API de WIAHost.
6. Conectar la web del socio a WIAHost en staging.
7. Activar coexistencia WIAHost -> Hostaway para que Hostaway siga bloqueando OTAs.
8. Cortar la web real del socio a WIAHost con rollback preparado.
9. Medir 7 dias de uso operativo.
10. Migrar Booking/Airbnb/Vrbo uno a uno cuando haya acceso API o bridge aprobado.

## Riesgos que no debemos ignorar

- API access puede tardar o requerir certificacion/partnership.
- iCal no es tiempo real y solo sirve para disponibilidad.
- Mapping incorrecto puede crear bloqueos equivocados.
- Mensajes externos tienen normas por canal.
- Datos personales pueden estar limitados por GDPR.
- Sin idempotencia, un webhook repetido puede duplicar reservas/mensajes.
- Sin audit trail, soporte no sabra que cambio vino de que canal.
- Sin feature flags, un fallo de canal puede afectar todo el portfolio.

## Fuentes de referencia

- Hostaway - tipos de conexion API/XML/iCal: https://support.hostaway.com/hc/en-us/articles/360004131874-Understanding-Channel-Connection-Types
- Hostaway - requisitos y limitaciones por canal: https://support.hostaway.com/hc/en-us/articles/49780010006043-Channel-Integration-Requirements-and-Limitations
- Hostaway - unified inbox: https://support.hostaway.com/hc/en-us/articles/1260803557189-Inbox-Overview-and-Key-Features
- Booking.com Connectivity APIs: https://developers.booking.com/connectivity/docs/
- Booking.com Reservations API: https://developers.booking.com/connectivity/docs/reservations-api/reservations-overview
- Airbnb Software Partners: https://www.airbnb.com/software-partners
- Airbnb API Terms: https://www.airbnb.com/terms/api
- Vrbo connectivity providers: https://help.vrbo.com/articles/About-Vrbo-integration
- Vrbo Connectivity Provider Guide: https://www.vrbo.com/connectivity/
