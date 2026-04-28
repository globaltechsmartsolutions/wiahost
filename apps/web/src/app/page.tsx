import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Inbox,
  KeyRound,
  LineChart,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { channelChips } from "@/lib/demo-data";

const modules = [
  {
    icon: CalendarDays,
    title: "Multi-calendario",
    text: "Reservas, bloqueos, precios y limpieza por propiedad, canal y fecha.",
  },
  {
    icon: Inbox,
    title: "Inbox con SLA",
    text: "Airbnb, Booking, WhatsApp, email y web directa sin saltar entre plataformas.",
  },
  {
    icon: CircleDollarSign,
    title: "Revenue y propietarios",
    text: "Ingresos, payouts, statements, fees y salud de canal en tiempo real.",
  },
  {
    icon: KeyRound,
    title: "Operaciones",
    text: "Check-in, smart locks, housekeeping, mantenimiento e incidencias conectadas.",
  },
];

const cockpitRows = [
  ["MAD-GV-01", "Airbnb", "Check-in 19:30", "645 €", "Urgente"],
  ["AGP-CT-02", "Directo", "En estancia", "420 €", "AC abierto"],
  ["VLC-SEA-03", "Booking", "Libre hasta viernes", "980 €", "OK"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6efe4] text-[#1b130b]">
      <section className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <nav className="z-10 flex items-center justify-between rounded-full border border-[#dfd2bf] bg-white/65 px-4 py-3 shadow-sm backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[#160f09] text-[#d8ff74]">
              <Sparkles className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">WIAHost</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-[#75695b] lg:flex">
            <a href="#producto">Producto</a>
            <a href="#canales">Canales</a>
            <a href="#operaciones">Operaciones</a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild className="rounded-full bg-[#160f09] text-white hover:bg-[#2b1d10]">
              <Link href="/dashboard">
                Ver demo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-12">
          <div>
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#dfd2bf] bg-white/70 px-4 py-2 text-sm text-[#75695b] shadow-sm">
              <LineChart className="size-4 text-emerald-700" />
              PMS + CRM + channel operations para alojamientos
            </div>

            <h1 className="max-w-5xl text-balance text-5xl font-semibold tracking-[-0.07em] sm:text-6xl lg:text-7xl">
              El centro de mando para operar alquiler turístico como una cadena hotelera.
            </h1>

            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-[#66584a] sm:text-xl">
              WIAHost centraliza calendario, reservas, inbox multicanal, tareas, incidencias, revenue,
              propietarios y automatizaciones en una experiencia lista para escalar.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-[#160f09] px-6 text-white hover:bg-[#2b1d10]">
                <Link href="/dashboard">
                  Entrar al cockpit demo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full border-[#dfd2bf] bg-white/55 px-6">
                <Link href="/properties">Ver inventario</Link>
              </Button>
            </div>

            <div id="canales" className="mt-9 flex max-w-2xl flex-wrap gap-2">
              {channelChips.map((channel) => (
                <span key={channel} className="rounded-full border border-[#dfd2bf] bg-white/60 px-3 py-1.5 text-sm font-medium text-[#5d5144]">
                  {channel}
                </span>
              ))}
            </div>
          </div>

          <div id="producto" className="relative">
            <div className="absolute -inset-8 rounded-[4rem] bg-[#d8ff74]/20 blur-3xl" />
            <Card className="relative overflow-hidden rounded-[2rem] border-[#27190c] bg-[#160f09] text-white shadow-2xl">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-sm text-white/50">Portfolio WIA · Hoy</p>
                    <h2 className="text-2xl font-semibold tracking-tight">Command center</h2>
                  </div>
                  <span className="rounded-full bg-[#d8ff74] px-3 py-1.5 text-sm font-bold text-[#160f09]">92% healthy</span>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-4">
                  {[
                    ["Ocupación", "94%", "+8%"],
                    ["Revenue", "42.850 €", "+12%"],
                    ["SLA inbox", "7m", "Live"],
                    ["Riesgos", "5", "Hoy"],
                  ].map(([label, value, helper]) => (
                    <div key={label} className="rounded-3xl border border-white/10 bg-white/7 p-4">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/38">{label}</p>
                      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
                      <p className="mt-2 text-xs text-[#d8ff74]">{helper}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 border-t border-white/10 bg-white/[0.03] p-5 lg:grid-cols-[1.25fr_0.75fr]">
                  <div className="rounded-3xl border border-white/10 bg-[#21160d] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-semibold">Multi-calendario</p>
                      <p className="text-xs text-white/45">7 días · 3 activos</p>
                    </div>
                    <div className="space-y-2">
                      {cockpitRows.map(([code, channel, state, amount, status]) => (
                        <div key={code} className="grid grid-cols-[0.8fr_0.7fr_1fr_0.6fr_0.7fr] items-center gap-2 rounded-2xl bg-white/7 px-3 py-3 text-xs">
                          <span className="font-mono text-white/70">{code}</span>
                          <span>{channel}</span>
                          <span className="text-white/60">{state}</span>
                          <span className="font-semibold">{amount}</span>
                          <span className="text-right text-[#d8ff74]">{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      ["Responder huésped", "Airbnb · 20 min", "Urgente"],
                      ["Enviar smart lock", "Check-in 19:30", "Automático"],
                      ["Asignar limpieza", "Checkout mañana", "Equipo"],
                    ].map(([title, text, tag]) => (
                      <div key={title} className="rounded-3xl border border-white/10 bg-[#21160d] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{title}</p>
                          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-[#d8ff74]">{tag}</span>
                        </div>
                        <p className="mt-2 text-sm text-white/50">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="operaciones" className="mx-auto grid max-w-[1500px] gap-4 px-5 pb-12 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
        {modules.map((module) => (
          <Card key={module.title} className="rounded-[2rem] border-[#dfd2bf] bg-white/66 shadow-sm">
            <CardContent className="p-5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#160f09] text-[#d8ff74]">
                <module.icon className="size-5" />
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{module.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#66584a]">{module.text}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="size-4 text-emerald-700" />
                Preparado para MVP
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
