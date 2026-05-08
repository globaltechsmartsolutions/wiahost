# Roadmap de integraciones API y Channel Manager

## Objetivo

Convertir WIAHost en el centro operativo de las viviendas, igual que un PMS/channel manager profesional:

- Una vivienda se gestiona una vez en WIAHost.
- La disponibilidad, reservas, precios, mensajes y tareas se sincronizan con canales externos.
- Cada canal se conecta con el nivel tecnico que permita: API, XML, webhooks, iCal o integracion via PMS intermedio.
- WIAHost mantiene trazabilidad, auditoria, anti-overbooking y control humano antes de automatizar cambios sensibles.

## Principio rector

No vamos a conectar todos los canales a la vez. Primero construiremos una base comun y despues conectaremos canales uno por uno.

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

### Adaptadores por canal

Cada canal tendra su propio adapter:

- `direct`: web propia / booking engine.
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

## Fases de ejecucion

## Fase A - Base channel manager interna

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

## Fase B - Piloto real seguro con iCal + web directa

Objetivo: probar con casas reales sin depender todavia de APIs cerradas.

Entregables:

- Import iCal por vivienda/canal.
- Export iCal por listing WIAHost.
- Monitor de ultima importacion y errores.
- Alerta si un feed no actualiza.
- Anti-overbooking validado contra reservas y bloqueos.
- Web directa para cada vivienda piloto.
- Checklist de onboarding para 2-3 viviendas reales.

Criterio de salida:

- Tu socio puede ver calendario consolidado real.
- Las reservas directas bloquean disponibilidad.
- Los canales externos pueden importar calendario WIAHost.
- No hay solapes en Supabase hosted.

## Fase C - Booking.com API/XML

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

## Fase D - Airbnb API partner o bridge PMS

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

## Fase E - Vrbo API/connectivity provider

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

## Fase F - Inbox unificado por API

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

## Fase G - Revenue y pricing sync

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

## Fase H - Certificacion, escalado y producto SaaS

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

1. Seleccionar 2-3 viviendas.
2. Cargar propiedades reales y reservas futuras.
3. Activar web directa y links publicos.
4. Conectar iCal Airbnb/Booking/Vrbo.
5. Validar anti-overbooking con datos reales.
6. Medir 7 dias de uso operativo.
7. Escoger primer canal API: Booking si hay camino de connectivity, Airbnb/Vrbo si hay acceso partner o PMS bridge.
8. Conectar un solo canal API en una sola vivienda.
9. Escalar a mas viviendas cuando haya 0 errores criticos durante una semana.

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
