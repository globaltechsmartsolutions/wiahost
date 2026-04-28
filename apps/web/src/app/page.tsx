import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Inbox,
  LineChart,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const modules = [
  {
    icon: CalendarDays,
    title: "Calendario y reservas",
    text: "Control multi-propiedad con check-ins, check-outs, bloqueos y origen del canal.",
  },
  {
    icon: Inbox,
    title: "Inbox unificado",
    text: "Mensajes de Airbnb, Booking, WhatsApp, email y web directa en una sola bandeja.",
  },
  {
    icon: LineChart,
    title: "Operaciones y revenue",
    text: "Tareas, incidencias, pagos, liquidaciones y señales para mejorar ocupación.",
  },
];

const proofPoints = ["Canales preparados", "Automatizaciones", "Portal propietario", "Motor directo"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl content-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

        <div className="flex flex-col justify-center">
          <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-foreground/15 bg-card/70 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="size-4 text-amber-700" />
            PMS + CRM para alojamientos de alto rendimiento
          </div>

          <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-[-0.06em] text-foreground sm:text-6xl lg:text-7xl">
            Gestiona reservas, huéspedes y operaciones sin perder el control.
          </h1>

          <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            WIAHost centraliza propiedades, canales, mensajes, limpiezas, incidencias, pagos y propietarios en una plataforma pensada para escalar alojamientos turísticos.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-6">
              <Link href="/dashboard">
                Ver panel demo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full bg-card/50 px-6">
              <Link href="/login">Entrar</Link>
            </Button>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {proofPoints.map((item) => (
              <div key={item} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-700" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-8 rounded-[3rem] bg-amber-300/20 blur-3xl" />
          <Card className="relative w-full overflow-hidden rounded-[2rem] border-foreground/10 bg-card/85 shadow-2xl backdrop-blur">
            <CardContent className="p-0">
              <div className="border-b border-border/70 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Operación de hoy</p>
                    <h2 className="text-2xl font-semibold tracking-tight">Madrid · Malaga · Valencia</h2>
                  </div>
                  <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                    94% ocupación
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {[
                  ["Check-ins", "7", "3 pendientes de instrucciones"],
                  ["Mensajes", "18", "2 sin responder > 15 min"],
                  ["Limpiezas", "11", "4 en curso"],
                  ["Incidencias", "3", "1 crítica"],
                ].map(([label, value, helper]) => (
                  <div key={label} className="rounded-3xl border border-border/80 bg-background/70 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
                    <p className="mt-4 text-4xl font-semibold tracking-tight">{value}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border/70 bg-muted/35 p-5">
                {modules.map((module) => (
                  <div key={module.title} className="flex gap-4 rounded-3xl border border-border/70 bg-card p-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <module.icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{module.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{module.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
