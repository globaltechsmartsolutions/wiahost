export const demoMetrics = [
  {
    helper: "Reservas no canceladas",
    label: "Reservas activas",
    value: "11",
  },
  {
    helper: "Total confirmado visible",
    label: "Ingresos",
    value: "5596 EUR",
  },
  {
    helper: "Mensajes pendientes",
    label: "SLA inbox",
    value: "4 min",
  },
  {
    helper: "Acciones operativas",
    label: "Riesgo operativo",
    value: "8",
  },
];

export const demoProperties = [
  {
    basePrice: 160,
    city: "Madrid",
    id: "mad-gv-01",
    internalName: "MAD-GV-01",
    name: "Atico Gran Via Sky",
    status: "Activo",
  },
  {
    basePrice: 145,
    city: "Malaga",
    id: "agp-ct-02",
    internalName: "AGP-CT-02",
    name: "Loft Malaga Centro",
    status: "Activo",
  },
  {
    basePrice: 132,
    city: "Valencia",
    id: "vlc-sea-03",
    internalName: "VLC-SEA-03",
    name: "Sea View Valencia",
    status: "Pausado",
  },
];

export const demoReservations = [
  {
    amount: "645 EUR",
    channel: "Airbnb",
    dates: "29 abr - 02 may",
    guest: "Sofia Martin",
    id: "res-1028",
    property: "Atico Gran Via Sky",
    status: "Confirmada",
    statusValue: "confirmed",
  },
  {
    amount: "420 EUR",
    channel: "Directo",
    dates: "27 abr - 30 abr",
    guest: "James Walker",
    id: "res-1029",
    property: "Loft Malaga Centro",
    status: "En estancia",
    statusValue: "checked_in",
  },
  {
    amount: "522 EUR",
    channel: "Booking",
    dates: "28 may - 31 may",
    guest: "Marta Costa",
    id: "res-1030",
    property: "Atico Gran Via Sky",
    status: "Confirmada",
    statusValue: "confirmed",
  },
];

export const demoQueue = [
  {
    entityType: "inbox",
    id: "inbox-1",
    label: "Responder a Sofia Martin",
    meta: "Atico Gran Via Sky - Inbox",
    priority: "Alta",
  },
  {
    entityType: "task",
    id: "demo-task-1",
    label: "Preparar Atico Gran Via",
    meta: "Limpieza - 28 abr, 13:00",
    priority: "Alta",
  },
  {
    entityType: "task",
    id: "demo-task-2",
    label: "Revisar aire acondicionado",
    meta: "Loft Malaga Centro - hoy",
    priority: "Media",
  },
];

export const demoIncidents = [
  {
    cost: "90 EUR estimados",
    id: "incident-1",
    property: "Loft Malaga Centro",
    severity: "Media",
    status: "Abierta",
    statusValue: "open",
    title: "Ruido en aire acondicionado",
  },
  {
    cost: "220 EUR estimados",
    id: "incident-2",
    property: "Atico Gran Via Sky",
    severity: "Alta",
    status: "Investigando",
    statusValue: "investigating",
    title: "Reposicion de cerradura inteligente",
  },
];

export const demoInbox = [
  {
    channel: "Airbnb",
    guest: "Sofia Martin",
    id: "inbox-1",
    message: "Llegaremos sobre las 19:30. Podemos hacer check-in autonomo?",
    property: "Atico Gran Via Sky",
    status: "Urgente",
    waiting: "4 min",
  },
  {
    channel: "WhatsApp",
    guest: "James Walker",
    id: "inbox-2",
    message: "The AC is making an intermittent noise.",
    property: "Loft Malaga Centro",
    status: "Operativo",
    waiting: "18 min",
  },
];
