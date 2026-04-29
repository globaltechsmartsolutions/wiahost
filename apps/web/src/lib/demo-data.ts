import type { DashboardMetric, NavigationItem } from "@wiahost/shared";

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Propiedades", href: "/properties" },
  { label: "Reservas", href: "/reservations" },
  { label: "Calendario", href: "/calendar" },
  { label: "Huespedes", href: "/guests" },
  { label: "Inbox", href: "/inbox" },
  { label: "Tareas", href: "/tasks" },
  { label: "Incidencias", href: "/incidents" },
  { label: "Propietarios", href: "/owners" },
  { label: "Ajustes", href: "/settings" },
];

export const channelChips = [
  "Airbnb",
  "Booking.com",
  "Vrbo",
  "Expedia",
  "Google",
  "Directo",
];

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Ocupacion",
    value: "94%",
    helper: "Proximos 30 dias",
    trend: "+8%",
  },
  {
    label: "Ingresos",
    value: "42.850 EUR",
    helper: "Abril confirmado",
    trend: "+12%",
  },
  {
    label: "ADR",
    value: "168 EUR",
    helper: "Tarifa media diaria",
    trend: "+6%",
  },
  {
    label: "Mensajes",
    value: "2",
    helper: "Sin respuesta urgente",
    trend: "-4",
  },
  {
    label: "Check-ins hoy",
    value: "7",
    helper: "3 pendientes de codigo",
    trend: "Hoy",
  },
  {
    label: "Tareas criticas",
    value: "5",
    helper: "Limpieza y mantenimiento",
    trend: "+2",
  },
];

export const executiveMetrics = [
  {
    label: "Reservas activas",
    value: "128",
    helper: "Abril - 42 propiedades",
    tone: "neutral",
  },
  {
    label: "RevPAR",
    value: "154 EUR",
    helper: "+11% vs mes anterior",
    tone: "positive",
  },
  {
    label: "SLA inbox",
    value: "7m",
    helper: "Respuesta media",
    tone: "positive",
  },
  {
    label: "Riesgo operativo",
    value: "5",
    helper: "Acciones antes de check-in",
    tone: "warning",
  },
];

export const properties = [
  {
    id: "mad-gv-01",
    internalName: "MAD-GV-01",
    name: "Atico Gran Via Sky",
    city: "Madrid",
    status: "Activo",
    channel: "Airbnb + Booking",
    occupancy: "97%",
    revenue: "18.420 EUR",
    nextCheckIn: "Manana - 19:30",
  },
  {
    id: "agp-ct-02",
    internalName: "AGP-CT-02",
    name: "Loft Malaga Centro",
    city: "Malaga",
    status: "Activo",
    channel: "Directo",
    occupancy: "91%",
    revenue: "9.850 EUR",
    nextCheckIn: "Hoy - 16:00",
  },
  {
    id: "vlc-sea-03",
    internalName: "VLC-SEA-03",
    name: "Sea View Valencia",
    city: "Valencia",
    status: "Pausado",
    channel: "Vrbo",
    occupancy: "76%",
    revenue: "7.220 EUR",
    nextCheckIn: "Viernes - 18:00",
  },
];

export const channelHealth = [
  {
    channel: "Airbnb",
    bookings: 54,
    revenue: "18.420 EUR",
    sync: "Sincronizado",
    health: 98,
  },
  {
    channel: "Booking.com",
    bookings: 38,
    revenue: "12.760 EUR",
    sync: "Sincronizado",
    health: 96,
  },
  {
    channel: "Directo",
    bookings: 21,
    revenue: "7.480 EUR",
    sync: "Motor activo",
    health: 91,
  },
  {
    channel: "Vrbo",
    bookings: 15,
    revenue: "4.190 EUR",
    sync: "Revisar tarifa",
    health: 82,
  },
];

export const reservations = [
  {
    id: "res-1028",
    guest: "Sofia Martin",
    property: "Atico Gran Via Sky",
    channel: "Airbnb",
    status: "Confirmada",
    dates: "29 abr - 2 may",
    amount: "645 EUR",
  },
  {
    id: "res-1029",
    guest: "James Walker",
    property: "Loft Malaga Centro",
    channel: "Directo",
    status: "En estancia",
    dates: "27 abr - 30 abr",
    amount: "420 EUR",
  },
  {
    id: "res-1030",
    guest: "Marta Costa",
    property: "Sea View Valencia",
    channel: "Booking",
    status: "Pendiente",
    dates: "4 may - 9 may",
    amount: "980 EUR",
  },
];

export const operationQueue = [
  {
    label: "Responder a Sofia Martin",
    description: "Check-in autonomo - Airbnb - llegada 19:30",
    type: "Inbox",
    priority: "Urgente",
    due: "20 min",
  },
  {
    label: "Validar codigo smart lock",
    description: "Atico Gran Via Sky - reserva res-1028",
    type: "Acceso",
    priority: "Alta",
    due: "Hoy 18:30",
  },
  {
    label: "Asignar tecnico AC",
    description: "Loft Malaga Centro - incidencia abierta",
    type: "Mantenimiento",
    priority: "Media",
    due: "Hoy 18:00",
  },
  {
    label: "Aprobar payout propietario",
    description: "WIA Demo Assets - cierre mensual",
    type: "Finanzas",
    priority: "Pendiente",
    due: "Viernes",
  },
];

export const tasks = [
  {
    id: "demo-task-1",
    title: "Preparar Atico Gran Via",
    property: "Atico Gran Via Sky",
    type: "Limpieza",
    status: "Programada",
    due: "Manana - 11:00",
    priority: "Alta",
  },
  {
    id: "demo-task-2",
    title: "Revisar aire acondicionado",
    property: "Loft Malaga Centro",
    type: "Mantenimiento",
    status: "Abierta",
    due: "Hoy - 18:00",
    priority: "Media",
  },
  {
    id: "demo-task-3",
    title: "Enviar instrucciones de llegada",
    property: "Atico Gran Via Sky",
    type: "Automatizacion",
    status: "Pendiente",
    due: "Hoy - 18:30",
    priority: "Alta",
  },
];

export const automationRules = [
  {
    name: "Instrucciones 24h antes",
    trigger: "Check-in 24h",
    status: "Activa",
    impact: "38 mensajes/mes",
  },
  {
    name: "Codigo smart lock 1h antes",
    trigger: "Check-in 1h",
    status: "Activa",
    impact: "7 hoy",
  },
  {
    name: "Aviso limpieza post check-out",
    trigger: "Checkout",
    status: "Activa",
    impact: "11 tareas",
  },
];

export const inboxThreads = [
  {
    id: "demo-conversation-1",
    guest: "Sofia Martin",
    channel: "Airbnb",
    property: "Atico Gran Via Sky",
    message: "Llegaremos sobre las 19:30. Podemos hacer check-in autonomo?",
    waiting: "20 min",
    status: "Urgente",
    priorityReason:
      "Check-in cercano y mensaje relacionado con llegada/acceso.",
  },
  {
    id: "demo-conversation-2",
    guest: "James Walker",
    channel: "WhatsApp",
    property: "Loft Malaga Centro",
    message: "The AC is making an intermittent noise.",
    waiting: "8 min",
    status: "Operativo",
    priorityReason: "Posible impacto operativo o mantenimiento.",
  },
  {
    id: "demo-conversation-3",
    guest: "Marta Costa",
    channel: "Booking",
    property: "Sea View Valencia",
    message: "Se puede anadir una cuna a la reserva?",
    waiting: "2 h",
    status: "Pendiente",
    priorityReason: "Consulta pendiente con espera superior a una hora.",
  },
];

export const incidents = [
  {
    id: "demo-incident-1",
    title: "Ruido en aire acondicionado",
    property: "Loft Malaga Centro",
    severity: "Media",
    status: "Abierta",
    cost: "90 EUR estimados",
  },
  {
    id: "demo-incident-2",
    title: "Reposicion de cerradura inteligente",
    property: "Atico Gran Via Sky",
    severity: "Alta",
    status: "Investigando",
    cost: "220 EUR estimados",
  },
];

export const calendarDays = [
  {
    day: "Lun",
    date: "27",
    events: ["Loft Malaga - estancia", "Limpieza Valencia"],
  },
  { day: "Mar", date: "28", events: ["Check-in Malaga", "Revision AC"] },
  { day: "Mie", date: "29", events: ["Check-in Madrid", "Codigo smart lock"] },
  { day: "Jue", date: "30", events: ["Check-out Malaga", "Limpieza Malaga"] },
  { day: "Vie", date: "01", events: ["Check-in Valencia"] },
  { day: "Sab", date: "02", events: ["Check-out Madrid"] },
  { day: "Dom", date: "03", events: ["Bloqueo mantenimiento"] },
];

export const calendarMatrix = [
  {
    property: "Atico Gran Via Sky",
    code: "MAD-GV-01",
    cells: [
      "Libre",
      "Libre",
      "Check-in - Airbnb",
      "Ocupado",
      "Ocupado",
      "Check-out",
      "Limpieza",
    ],
  },
  {
    property: "Loft Malaga Centro",
    code: "AGP-CT-02",
    cells: [
      "Ocupado",
      "Check-in - Directo",
      "Ocupado",
      "Check-out",
      "Limpieza",
      "Libre",
      "Libre",
    ],
  },
  {
    property: "Sea View Valencia",
    code: "VLC-SEA-03",
    cells: [
      "Limpieza",
      "Libre",
      "Libre",
      "Libre",
      "Check-in - Booking",
      "Ocupado",
      "Bloqueo",
    ],
  },
  {
    property: "Eixample Urban Suite",
    code: "BCN-EIX-04",
    cells: [
      "Check-out",
      "Limpieza",
      "Libre",
      "Check-in - Vrbo",
      "Ocupado",
      "Ocupado",
      "Libre",
    ],
  },
];
