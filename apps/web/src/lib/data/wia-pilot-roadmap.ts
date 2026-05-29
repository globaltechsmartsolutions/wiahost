export type WiaPilotPhaseStatus =
  | "completed"
  | "in_progress"
  | "next"
  | "planned"
  | "blocked";

export type WiaPilotPhase = {
  id: string;
  number: string;
  title: string;
  status: WiaPilotPhaseStatus;
  owner: string;
  objective: string;
  localProof: string[];
  deliverables: string[];
  exitCriteria: string[];
  nextActions: string[];
};

export const wiaPilotUpdatedAt = "2026-05-29";

export const wiaPilotPrinciples = [
  "La web de World Institutional Assets no cambia visualmente salvo que lo decidamos.",
  "WIA es el primer piloto, pero la API debe servir para cualquier web externa con su propio partnerId.",
  "WIAHost debe convertirse en el centro operativo antes de apagar Hostaway.",
  "iCal queda fuera del piloto: si no hay API, XML, webhook o bridge aprobado, el canal espera.",
  "Cada paso debe poder probarse en local, luego en preproducción y solo después en producción.",
  "Cada reserva o mensaje externo debe ser idempotente para evitar duplicados.",
  "Nada debe quedar hardcodeado para WIA salvo el seed y la configuración del piloto.",
];

export const wiaPilotLinks = [
  {
    description: "Página de búsqueda de WIA consumiendo WIAHost local.",
    href: "http://localhost:5500/booking.html?checkIn=2026-07-01&checkOut=2026-07-05&guests=2",
    label: "WIA local",
  },
  {
    description: "Búsqueda autorizada desde el backend de WIA hacia WIAHost.",
    href: "http://localhost:5500/api/hostaway/search?checkIn=2026-07-01&checkOut=2026-07-05&guests=2",
    label: "WIA API local",
  },
  {
    description: "Inventario protegido: requiere x-wiahost-partner-key fuera del backend de WIA.",
    href: "http://localhost:3002/api/public/v1/listings?partner=worldinstitutionalassets",
    label: "API protegida",
  },
  {
    description: "Panel actual de distribución y conectores de WIAHost.",
    href: "http://localhost:3002/distribution",
    label: "Distribución",
  },
  {
    description: "Gestión interna de webs externas conectadas a WIAHost.",
    href: "http://localhost:3002/partner-apps",
    label: "Webs conectadas",
  },
];

export const wiaPilotMetrics = [
  {
    label: "Web directa local",
    value: "Conectada",
  },
  {
    label: "Villas WIA cargadas",
    value: "3",
  },
  {
    label: "Proveedor actual",
    value: "WIAHost local",
  },
  {
    label: "Partner API",
    value: "Demo local cerrada",
  },
  {
    label: "Modelo producto",
    value: "Cualquier web + DB",
  },
  {
    label: "Webs conectadas",
    value: "Pantalla local",
  },
  {
    label: "Producción",
    value: "Sin tocar",
  },
];

export const wiaPilotPhases: WiaPilotPhase[] = [
  {
    id: "fase-0",
    number: "0",
    title: "Base local y aislamiento de producción",
    status: "completed",
    owner: "WIAHost + WIA web local",
    objective:
      "Crear una copia local de trabajo donde la web de WIA pueda consultar WIAHost sin modificar la web real ni Hostaway.",
    localProof: [
      "WIAHost local responde en localhost:3002.",
      "La web WIA local responde en localhost:5500.",
      "Producción sigue usando Hostaway.",
    ],
    deliverables: [
      "Rama WIAHost wia-public-partner-api.",
      "Rama WIA wiahost-migration.",
      "Variables BOOKING_PROVIDER, WIAHOST_BASE_URL, WIAHOST_BOOKING_ENGINE_URL y WIAHOST_PARTNER_ID.",
      "Rollback conceptual a BOOKING_PROVIDER=hostaway.",
    ],
    exitCriteria: [
      "La web WIA local carga sin errores.",
      "La web real de World Institutional Assets no cambia.",
      "Hay separación clara entre local, preproducción y producción.",
    ],
    nextActions: [
      "Mantener esta fase congelada como baseline de seguridad.",
      "No desplegar todavía.",
    ],
  },
  {
    id: "fase-1",
    number: "1",
    title: "Inventario real de WIA en WIAHost",
    status: "completed",
    owner: "WIAHost local",
    objective:
      "Cargar en WIAHost local las propiedades que la web de WIA está mostrando hoy desde Hostaway.",
    localProof: [
      "La API pública devuelve los IDs Hostaway 419018, 419019 y 419020.",
      "Cada anuncio tiene slug, foto principal, capacidad, dormitorios, baños, precio base y amenities.",
      "El filtro partner=worldinstitutionalassets evita mezclar datos demo.",
    ],
    deliverables: [
      "Script pnpm wia:seed:local.",
      "Tres listings publicados para worldinstitutionalassets.",
      "Metadatos temporales en sync_notes para conservar imagen, partner e ID externo.",
      "API pública con thumbnailUrl, amenities, externalListingId y partnerId.",
    ],
    exitCriteria: [
      "GET /api/public/v1/listings?partner=worldinstitutionalassets devuelve 3 resultados.",
      "GET /api/public/v1/availability devuelve disponibilidad real de WIAHost.",
      "Las fotos cargan en la web WIA local.",
    ],
    nextActions: [
      "Sustituir metadatos temporales por columnas o tablas dedicadas antes de escalar.",
      "Importar el inventario completo cuando tengamos acceso real a Hostaway.",
    ],
  },
  {
    id: "fase-2",
    number: "2",
    title: "Partner API seria para webs externas",
    status: "in_progress",
    owner: "WIAHost API",
    objective:
      "Convertir la API pública inicial en una Partner Channel API reutilizable, segura y preparada para cualquier web externa, no solo WIA.",
    localProof: [
      "Los endpoints versionados ya existen para listings, disponibilidad e inquiries.",
      "La web WIA local consume disponibilidad desde WIAHost.",
      "Los enlaces de reserva ya apuntan al motor WIAHost local.",
      "La API ya resuelve partner por query y puede exigir clave si WIAHOST_PUBLIC_API_KEYS está configurado.",
      "Una solicitud enviada desde el flujo WIA local -> WIAHost local aparece en /leads.",
      "La API permite consultar el estado de una solicitud por externalId/idempotency key.",
      "Vitest cubre resolución de partner, externalReservationId y endpoint público de estado.",
      "La guía Partner Website API define cómo conectar cualquier web sin acoplarla a WIA.",
      "La migración 0009_partner_apps.sql permite persistir webs conectadas y claves hasheadas.",
      "Prueba local DB: sin clave devuelve 401 cuando hay partner app activa; con clave devuelve authMode=partner_app y 3 listings.",
      "/partner-apps muestra World Institutional Assets como partner app local para operadores autenticados.",
      "La API pública aplica rate limit por partner usando rate_limit_per_minute.",
      "WIA local usa una clave backend en .env y crea solicitudes en WIAHost con la partner app activa.",
      "pnpm wia:demo:local valida búsqueda WIA, 401 sin clave, inquiry y consulta de estado por externalId.",
      "Un lead creado por Partner API se prepara para pago y se confirma desde /leads, generando sync outbound simulado.",
    ],
    deliverables: [
      "Resolución de partner app por entorno iniciada.",
      "Soporte para x-wiahost-partner-key o Authorization: Bearer cuando haya claves configuradas.",
      "Idempotency-Key implementado en POST /api/public/v1/inquiries.",
      "Reintentos de la misma solicitud devuelven el mismo reservationId sin duplicar lead.",
      "GET /api/public/v1/reservations/[externalId] implementado para consultar estado.",
      "Pruebas unitarias de Partner API añadidas al test suite del web app.",
      "Documento docs/PARTNER_WEBSITE_INTEGRATION.md con modos de conexión para cualquier web.",
      "API keys por partner sin guardar secretos en claro.",
      "Partner apps con dominios permitidos, URLs de retorno, webhooks y configuración propia.",
      "Resolver público preparado para validar claves desde public.partner_apps y mantener fallback dev por entorno.",
      "Pantalla interna /partner-apps para crear, editar, pausar y eliminar webs externas conectadas.",
      "Rate limit por partner conectado al valor rate_limit_per_minute de la partner app.",
      "Autenticación server-to-server por bearer token o firma HMAC.",
      "Idempotency-Key en creación de leads y reservas.",
      "Errores normalizados para validación, permisos, disponibilidad y mapping.",
      "Rate limit por partner app.",
      "Endpoint POST /api/public/v1/reservations o evolución formal de inquiries.",
    ],
    exitCriteria: [
      "Una web externa puede consultar disponibilidad y crear una solicitud sin depender de Hostaway.",
      "Una nueva web puede conectarse cambiando solo partnerId, credenciales y mapping.",
      "Una petición repetida no duplica reservas ni leads.",
      "Las credenciales de un partner no permiten leer datos de otro.",
    ],
    nextActions: [
      "Reactivar Supabase staging o apuntar .env.staging.local a un nuevo proyecto Supabase pre.",
      "Aplicar partner_apps en preproducción y crear la partner app real de WIA.",
      "Añadir rotación de claves desde /partner-apps con doble clave activa durante ventana controlada.",
      "Separar formalmente inquiries de reservations si decidimos que los leads no deben vivir como reservation status inquiry.",
      "Convertir pnpm wia:demo:local en prueba e2e de CI/preproducción cuando staging vuelva a tener base de datos sana.",
    ],
  },
  {
    id: "fase-3",
    number: "3",
    title: "Motor de reserva directa WIAHost",
    status: "in_progress",
    owner: "Booking engine WIAHost",
    objective:
      "Cerrar el flujo completo de búsqueda, solicitud, bloqueo y pago desde WIAHost para que la web WIA no necesite Hostaway en reservas directas.",
    localProof: [
      "Los botones de la web WIA ya apuntan a /book/[slug] en WIAHost local.",
      "WIAHost ya tiene rutas de book y checkout.",
      "El lead directo puede pasar a pago preparado y confirmado desde /leads.",
      "La confirmación genera channel_sync_events con action=direct_reservation_confirmed en modo simulación local.",
    ],
    deliverables: [
      "Formulario de reserva o solicitud conectado a WIAHost.",
      "Bloqueo anti-overbooking antes de confirmar.",
      "Lead visible en /leads y reserva visible en /reservations.",
      "Correo o notificación interna al equipo.",
      "Pago test con Stripe si se decide cobrar desde WIAHost.",
    ],
    exitCriteria: [
      "Desde WIA local se puede generar un lead real en WIAHost local.",
      "El equipo ve el lead en el panel.",
      "La disponibilidad queda bloqueada o pendiente de revisión según el modo elegido.",
    ],
    nextActions: [
      "Decidir si el primer piloto confirma reservas o solo genera leads revisables.",
      "Añadir una vista operativa para ver los eventos outbound pendientes por reserva.",
    ],
  },
  {
    id: "fase-4",
    number: "4",
    title: "Hostaway Bridge read-only",
    status: "planned",
    owner: "Importer Hostaway",
    objective:
      "Leer datos reales de Hostaway sin escribir todavía, para comparar WIAHost contra el sistema actual.",
    localProof: [
      "Con credenciales reales podremos importar a local o preproducción controlada.",
      "La UI de distribución ya puede mostrar conectores y eventos de sincronización.",
    ],
    deliverables: [
      "Credenciales Hostaway en entorno seguro.",
      "Importador de listings, reservas futuras, bloqueos y precios si la API lo permite.",
      "Webhook receiver para cambios de reservas y mensajes.",
      "Panel de discrepancias Hostaway vs WIAHost.",
      "Eventos idempotentes en channel_sync_events.",
    ],
    exitCriteria: [
      "WIAHost refleja Hostaway sin modificar Hostaway.",
      "Podemos ver diferencias por propiedad, fecha y canal.",
      "Los webhooks repetidos no duplican reservas.",
    ],
    nextActions: [
      "Pedir a tu amigo las credenciales/API o export completo de Hostaway.",
      "Crear adapter hostaway_bridge con modo read-only.",
    ],
  },
  {
    id: "fase-5",
    number: "5",
    title: "Coexistencia WIAHost -> Hostaway",
    status: "planned",
    owner: "Sync outbound",
    objective:
      "Mientras Hostaway siga conectado a Airbnb, Booking o Vrbo, WIAHost debe reflejar reservas directas nuevas en Hostaway para proteger esos canales.",
    localProof: [
      "Primero se simula con adapter fake en local.",
      "Después se prueba en preproducción contra Hostaway si hay sandbox o vivienda piloto.",
    ],
    deliverables: [
      "Cola de sincronización saliente.",
      "Writeback de reservas directas WIAHost -> Hostaway.",
      "Estados succeeded, failed, retrying y needs_review.",
      "Alertas visibles cuando Hostaway rechace una reserva.",
    ],
    exitCriteria: [
      "Una reserva directa creada en WIAHost bloquea también el sistema que protege OTAs.",
      "Si falla la escritura, operaciones lo ve antes de que haya riesgo operativo.",
    ],
    nextActions: [
      "Esperar a tener Hostaway Bridge read-only estable.",
      "Definir qué eventos se escriben y cuáles quedan solo en revisión humana.",
    ],
  },
  {
    id: "fase-6",
    number: "6",
    title: "Preproducción WIA",
    status: "planned",
    owner: "Deploy + QA",
    objective:
      "Replicar el flujo local en un entorno público de preproducción antes de tocar la web real.",
    localProof: [
      "La página local de roadmap será la referencia de checklist.",
      "La web WIA seguirá teniendo rollback por variables.",
    ],
    deliverables: [
      "WIAHost preproducción con Supabase pre.",
      "Web WIA staging apuntando a WIAHost pre.",
      "Seed o import real de WIA en pre.",
      "Checklist de búsqueda, lead, reserva, pago, mensajes y disponibilidad.",
    ],
    exitCriteria: [
      "El flujo completo funciona fuera de local.",
      "Hay rollback documentado y probado.",
      "Tu amigo puede revisar la web staging antes del corte.",
    ],
    nextActions: [
      "Elegir dominio o URL de staging.",
      "Configurar variables de entorno en preproducción.",
    ],
  },
  {
    id: "fase-7",
    number: "7",
    title: "Corte controlado de la web real",
    status: "planned",
    owner: "WIA web production",
    objective:
      "Cambiar la web real de WIA de Hostaway a WIAHost solo cuando local y preproducción estén validados.",
    localProof: [
      "El mismo cambio ya se habrá probado en local y preproducción.",
      "El rollback es volver a BOOKING_PROVIDER=hostaway.",
    ],
    deliverables: [
      "Ventana de corte acordada.",
      "Variables de producción configuradas.",
      "Monitor de errores y reservas 24/48h.",
      "Plan de rollback inmediato.",
    ],
    exitCriteria: [
      "La web real busca y reserva sobre WIAHost.",
      "No hay reservas perdidas ni dobles reservas.",
      "Hostaway queda como puente para canales externos hasta migrarlos.",
    ],
    nextActions: [
      "No activar hasta completar fases 2, 3, 4, 5 y 6.",
    ],
  },
  {
    id: "fase-8",
    number: "8",
    title: "Channel manager API-first",
    status: "planned",
    owner: "Conectores oficiales",
    objective:
      "Centralizar Booking, Airbnb, Vrbo y otros canales con conectores oficiales o bridges aprobados, sin iCal ni sincronización de calendario como vía aceptada.",
    localProof: [
      "WIAHost ya tiene pantalla de distribución y modelo de eventos de sincronización.",
      "Los adapters se podrán simular localmente antes de tocar cuentas reales.",
    ],
    deliverables: [
      "Adapter interface por canal.",
      "Booking.com Connectivity API/XML cuando haya acceso.",
      "Airbnb API partner o bridge PMS aprobado.",
      "Vrbo connectivity provider/API cuando haya acceso.",
      "Inbox, rates y reservas normalizados por canal.",
    ],
    exitCriteria: [
      "WIAHost puede empujar disponibilidad y precios por API donde el canal lo permita.",
      "WIAHost recibe reservas y mensajes externos sin duplicar datos.",
      "Cada canal tiene health, logs, retry y revisión humana.",
    ],
    nextActions: [
      "Priorizar Booking.com como primer canal API serio si el acceso lo permite.",
      "Documentar requisitos de acceso de cada canal con tu amigo.",
    ],
  },
];

export function getWiaPilotPhaseLabel(status: WiaPilotPhaseStatus) {
  const labels: Record<WiaPilotPhaseStatus, string> = {
    blocked: "Bloqueada",
    completed: "Completada",
    in_progress: "En curso",
    next: "Siguiente",
    planned: "Planificada",
  };

  return labels[status];
}
