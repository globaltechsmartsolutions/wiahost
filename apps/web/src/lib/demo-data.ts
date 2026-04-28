import type { DashboardMetric, NavigationItem } from "@wiahost/shared";

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Propiedades", href: "/properties" },
  { label: "Reservas", href: "/reservations" },
  { label: "Calendario", href: "/calendar" },
  { label: "Huéspedes", href: "/guests" },
  { label: "Inbox", href: "/inbox" },
  { label: "Tareas", href: "/tasks" },
  { label: "Incidencias", href: "/incidents" },
  { label: "Propietarios", href: "/owners" },
  { label: "Ajustes", href: "/settings" },
];

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Ocupación", value: "94%", helper: "Próximos 30 días", trend: "+8%" },
  { label: "Ingresos", value: "42.850 €", helper: "Abril confirmado", trend: "+12%" },
  { label: "ADR", value: "168 €", helper: "Tarifa media diaria", trend: "+6%" },
  { label: "Mensajes", value: "2", helper: "Sin respuesta urgente", trend: "-4" },
  { label: "Check-ins hoy", value: "7", helper: "3 pendientes de código", trend: "Hoy" },
  { label: "Tareas críticas", value: "5", helper: "Limpieza y mantenimiento", trend: "+2" },
];

export const properties = [
  {
    id: "mad-gv-01",
    internalName: "MAD-GV-01",
    name: "Ático Gran Vía Sky",
    city: "Madrid",
    status: "Activo",
    channel: "Airbnb + Booking",
    occupancy: "97%",
    revenue: "18.420 €",
    nextCheckIn: "Mañana · 19:30",
  },
  {
    id: "agp-ct-02",
    internalName: "AGP-CT-02",
    name: "Loft Málaga Centro",
    city: "Málaga",
    status: "Activo",
    channel: "Directo",
    occupancy: "91%",
    revenue: "9.850 €",
    nextCheckIn: "Hoy · 16:00",
  },
  {
    id: "vlc-sea-03",
    internalName: "VLC-SEA-03",
    name: "Sea View Valencia",
    city: "Valencia",
    status: "Pausado",
    channel: "Vrbo",
    occupancy: "76%",
    revenue: "7.220 €",
    nextCheckIn: "Viernes · 18:00",
  },
];

export const reservations = [
  {
    id: "res-1028",
    guest: "Sofía Martín",
    property: "Ático Gran Vía Sky",
    channel: "Airbnb",
    status: "Confirmada",
    dates: "29 abr - 2 may",
    amount: "645 €",
  },
  {
    id: "res-1029",
    guest: "James Walker",
    property: "Loft Málaga Centro",
    channel: "Directo",
    status: "En estancia",
    dates: "27 abr - 30 abr",
    amount: "420 €",
  },
  {
    id: "res-1030",
    guest: "Marta Costa",
    property: "Sea View Valencia",
    channel: "Booking",
    status: "Pendiente",
    dates: "4 may - 9 may",
    amount: "980 €",
  },
];

export const tasks = [
  {
    title: "Preparar Ático Gran Vía",
    property: "Ático Gran Vía Sky",
    type: "Limpieza",
    status: "Programada",
    due: "Mañana · 11:00",
    priority: "Alta",
  },
  {
    title: "Revisar aire acondicionado",
    property: "Loft Málaga Centro",
    type: "Mantenimiento",
    status: "Abierta",
    due: "Hoy · 18:00",
    priority: "Media",
  },
  {
    title: "Enviar instrucciones de llegada",
    property: "Ático Gran Vía Sky",
    type: "Automatización",
    status: "Pendiente",
    due: "Hoy · 18:30",
    priority: "Alta",
  },
];

export const inboxThreads = [
  {
    guest: "Sofía Martín",
    channel: "Airbnb",
    property: "Ático Gran Vía Sky",
    message: "Llegaremos sobre las 19:30. ¿Podemos hacer check-in autónomo?",
    waiting: "20 min",
    status: "Urgente",
  },
  {
    guest: "James Walker",
    channel: "WhatsApp",
    property: "Loft Málaga Centro",
    message: "The AC is making an intermittent noise.",
    waiting: "8 min",
    status: "Operativo",
  },
  {
    guest: "Marta Costa",
    channel: "Booking",
    property: "Sea View Valencia",
    message: "¿Se puede añadir una cuna a la reserva?",
    waiting: "2 h",
    status: "Pendiente",
  },
];

export const incidents = [
  {
    title: "Ruido en aire acondicionado",
    property: "Loft Málaga Centro",
    severity: "Media",
    status: "Abierta",
    cost: "90 € estimados",
  },
  {
    title: "Reposición de cerradura inteligente",
    property: "Ático Gran Vía Sky",
    severity: "Alta",
    status: "Investigando",
    cost: "220 € estimados",
  },
];

export const calendarDays = [
  { day: "Lun", date: "27", events: ["Loft Málaga · estancia", "Limpieza Valencia"] },
  { day: "Mar", date: "28", events: ["Check-in Málaga", "Revisión AC"] },
  { day: "Mié", date: "29", events: ["Check-in Madrid", "Código smart lock"] },
  { day: "Jue", date: "30", events: ["Check-out Málaga", "Limpieza Málaga"] },
  { day: "Vie", date: "01", events: ["Check-in Valencia"] },
  { day: "Sáb", date: "02", events: ["Check-out Madrid"] },
  { day: "Dom", date: "03", events: ["Bloqueo mantenimiento"] },
];
