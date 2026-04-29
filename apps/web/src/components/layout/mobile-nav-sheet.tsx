"use client";

import Link from "next/link";
import {
  Bell,
  Bot,
  Building2,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  Home,
  Inbox,
  KeyRound,
  Landmark,
  Menu,
  MessageSquareWarning,
  MousePointerClick,
  RadioTower,
  ScrollText,
  Send,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const mobileNavSections = [
  {
    title: "Control",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Calendario", href: "/calendar", icon: CalendarDays },
      { label: "Reservas", href: "/reservations", icon: ClipboardCheck },
      { label: "Inbox", href: "/inbox", icon: Inbox },
      { label: "Leads", href: "/leads", icon: MousePointerClick },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Propiedades", href: "/properties", icon: Building2 },
      { label: "Huéspedes", href: "/guests", icon: Users },
      { label: "Tareas", href: "/tasks", icon: KeyRound },
      { label: "Incidencias", href: "/incidents", icon: MessageSquareWarning },
    ],
  },
  {
    title: "Negocio",
    items: [
      { label: "Propietarios", href: "/owners", icon: Landmark },
      { label: "Liquidaciones", href: "/statements", icon: CreditCard },
      { label: "Distribución", href: "/distribution", icon: RadioTower },
      { label: "Notificaciones", href: "/notifications", icon: Bell },
      { label: "Precios", href: "/pricing", icon: TrendingUp },
      { label: "Automatizaciones", href: "/automations", icon: Bot },
      { label: "Check-in/out", href: "/workflows", icon: Send },
      { label: "Auditoría", href: "/audit", icon: ScrollText },
      { label: "Documentos", href: "/documents", icon: FileText },
      { label: "Pagos", href: "/payments", icon: CreditCard },
      { label: "Ajustes", href: "/settings", icon: Settings },
    ],
  },
];

export function MobileNavSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-[#dfd2bf] bg-white/70 xl:hidden"
        >
          <Menu className="size-4" />
          <span className="sr-only">Abrir navegación</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[20rem] border-white/10 bg-[#160f09] p-0 text-white"
      >
        <SheetHeader className="border-b border-white/10 p-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-white">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#d8ff74] text-[#160f09]">
              <Building2 className="size-4" />
            </span>
            WIAHost
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navegación principal de WIAHost para pantallas móviles y tablet.
          </SheetDescription>
        </SheetHeader>
        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {mobileNavSections.map((section) => (
            <div key={section.title}>
              <p className="px-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/65">
                {section.title}
              </p>
              <div className="mt-2 grid gap-1">
                {section.items.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.86rem] font-medium text-white/72 transition hover:bg-white/10 hover:text-white"
                    >
                      <item.icon className="size-3.5 text-white/40 transition group-hover:text-[#d8ff74]" />
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
