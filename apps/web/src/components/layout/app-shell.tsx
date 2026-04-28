import Link from "next/link";
import {
  BarChart3,
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
  MessageSquareWarning,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navSections = [
  {
    title: "Control",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Calendario", href: "/calendar", icon: CalendarDays },
      { label: "Reservas", href: "/reservations", icon: ClipboardCheck },
      { label: "Inbox", href: "/inbox", icon: Inbox },
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
      { label: "Automatizaciones", href: "/automations", icon: Bot },
      { label: "Documentos", href: "/documents", icon: FileText },
      { label: "Pagos", href: "/payments", icon: CreditCard },
      { label: "Ajustes", href: "/settings", icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6efe4] text-[#1b130b]">
      <aside className="fixed inset-y-2 left-2 z-20 hidden w-56 flex-col overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#160f09] text-white shadow-2xl 2xl:w-60 xl:flex">
        <div className="border-b border-white/10 p-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#d8ff74] text-[#160f09]">
              <Building2 className="size-4" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">
                WIAHost
              </span>
              <span className="block text-[0.68rem] text-white/70">
                Hospitality command center
              </span>
            </span>
          </Link>
        </div>

        <nav className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/65">
                {section.title}
              </p>
              <div className="mt-2 grid gap-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[0.8rem] font-medium text-white/68 transition hover:bg-white/10 hover:text-white"
                  >
                    <item.icon className="size-3.5 text-white/40 transition group-hover:text-[#d8ff74]" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2.5">
          <div className="rounded-[1.2rem] border border-[#d8ff74]/25 bg-[#d8ff74]/10 p-2.5">
            <div className="flex items-center gap-2 text-[#d8ff74]">
              <BarChart3 className="size-3.5" />
              <p className="text-xs font-semibold">Portfolio health</p>
            </div>
            <p className="mt-1.5 text-2xl font-semibold">92%</p>
            <p className="mt-1 text-[0.68rem] leading-4 text-white/70">
              Canales sincronizados, SLA de mensajes y tareas críticas bajo
              control.
            </p>
          </div>
        </div>
      </aside>

      <div className="xl:pl-[15rem] 2xl:pl-[15.5rem]">
        <header className="sticky top-0 z-10 border-b border-[#dfd2bf] bg-[#f6efe4]/86 px-4 py-2 backdrop-blur-xl lg:px-5">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold xl:hidden"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#160f09] text-white">
                <Building2 className="size-4" />
              </span>
              WIAHost
            </Link>
            <div className="relative hidden flex-1 md:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#75695b]" />
              <Input
                aria-label="Buscar reserva, huesped, propiedad, canal o tarea"
                className="h-9 rounded-full border-[#dfd2bf] bg-white/70 pl-9 text-sm shadow-sm"
                placeholder="Buscar reserva, huésped, propiedad, canal o tarea..."
              />
            </div>
            <Button
              variant="outline"
              className="hidden rounded-full border-[#dfd2bf] bg-white/70 lg:inline-flex"
            >
              Abril 2026
            </Button>
            <Button
              variant="outline"
              className="hidden rounded-full border-[#dfd2bf] bg-white/70 lg:inline-flex"
            >
              Portfolio Madrid + Costa
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="ml-auto rounded-full border-[#dfd2bf] bg-white/70"
            >
              <Bell className="size-4" />
              <span className="sr-only">Abrir notificaciones</span>
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-4">
                Laura Operaciones
              </p>
              <p className="text-xs text-[#75695b]">Admin demo · WIA</p>
            </div>
            <form action={signOutAction} className="hidden sm:block">
              <Button
                type="submit"
                variant="outline"
                className="rounded-full border-[#dfd2bf] bg-white/70"
              >
                Salir
              </Button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-4 lg:px-5">
          {children}
        </main>
      </div>
    </div>
  );
}
