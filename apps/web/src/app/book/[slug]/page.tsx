import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Home,
  MapPin,
  Users,
} from "lucide-react";

import { createDirectBookingInquiryAction } from "@/lib/actions/direct-booking";
import { requirePublicBookingListing } from "@/lib/data/direct-booking";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

type BookingPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    error?: string;
    sent?: string;
  }>;
};

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const listing = await requirePublicBookingListing(slug);

  return (
    <main className="min-h-screen bg-[#f6efe4] text-[#1b130b]">
      <section className="mx-auto grid min-h-screen max-w-[1280px] gap-6 px-5 py-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="flex flex-col gap-5">
          <nav className="flex items-center justify-between rounded-full border border-[#dfd2bf] bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-[#160f09] text-[#d8ff74]">
                <Home className="size-4" />
              </span>
              WIAHost
            </Link>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-[#dfd2bf] bg-white/60"
            >
              <Link href="/">
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            </Button>
          </nav>

          <Card className="overflow-hidden rounded-[2rem] border-[#dfd2bf] bg-white/72 shadow-sm">
            <div className="min-h-[280px] bg-[radial-gradient(circle_at_24%_20%,#d8ff74_0,#d8ff74_18%,transparent_18%),linear-gradient(135deg,#160f09,#3b3016)] p-6 text-white">
              <div className="flex h-full min-h-[230px] flex-col justify-end">
                <p className="mb-3 inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                  Reserva directa gestionada por WIAHost
                </p>
                <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                  {listing.title}
                </h1>
                <p className="mt-4 flex items-center gap-2 text-white/72">
                  <MapPin className="size-4" />
                  {listing.address}
                </p>
              </div>
            </div>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-4">
              <Fact
                icon={Users}
                label="Huespedes"
                value={`Hasta ${listing.maxGuests}`}
              />
              <Fact
                icon={BedDouble}
                label="Dormitorios"
                value={String(listing.bedrooms)}
              />
              <Fact label="Banos" value={String(listing.bathrooms)} />
              <Fact
                icon={CalendarDays}
                label="Desde"
                value={`${listing.basePrice} EUR/noche`}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-[#dfd2bf] bg-white/72 shadow-sm">
            <CardHeader>
              <CardTitle>Informacion del alojamiento</CardTitle>
              <CardDescription>
                Solicitud directa sin comisiones de portal. El equipo revisa
                disponibilidad y confirma manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm leading-7 text-[#66584a]">
              <p>{listing.description}</p>
              <div className="rounded-3xl border border-[#dfd2bf] bg-[#fbf7ef] p-4">
                <p className="font-semibold text-[#1b130b]">
                  Normas de la casa
                </p>
                <p className="mt-2">{listing.houseRules}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniTrust text="Solicitud revisada por operaciones" />
                <MiniTrust text="Mensajes centralizados en el inbox" />
                <MiniTrust text="Precio estimado antes de confirmar" />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-5 lg:self-start">
          <Card className="rounded-[2rem] border-[#dfd2bf] bg-white/82 shadow-xl">
            <CardHeader>
              <CardTitle>Solicitar reserva</CardTitle>
              <CardDescription>
                No se cobra nada ahora. Te responderemos para confirmar
                disponibilidad, precio final e instrucciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {query?.error ? (
                <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {query.error}
                </div>
              ) : null}
              {query?.sent ? (
                <div className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Solicitud enviada. El equipo la revisara y te respondera
                  pronto.
                </div>
              ) : null}

              <form
                action={createDirectBookingInquiryAction}
                className="grid gap-4"
              >
                <input type="hidden" name="slug" value={listing.slug} />
                <Field id="guestFullName" label="Nombre completo">
                  <Input
                    id="guestFullName"
                    name="guestFullName"
                    required
                    placeholder="Sofia Martin"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="guestEmail" label="Email">
                    <Input
                      id="guestEmail"
                      name="guestEmail"
                      type="email"
                      required
                      placeholder="tu@email.com"
                    />
                  </Field>
                  <Field id="guestPhone" label="Telefono">
                    <Input
                      id="guestPhone"
                      name="guestPhone"
                      placeholder="+34 600 000 000"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="checkIn" label="Entrada">
                    <Input id="checkIn" name="checkIn" type="date" required />
                  </Field>
                  <Field id="checkOut" label="Salida">
                    <Input id="checkOut" name="checkOut" type="date" required />
                  </Field>
                </div>
                <Field id="guestsCount" label="Numero de huespedes">
                  <Input
                    id="guestsCount"
                    name="guestsCount"
                    type="number"
                    min="1"
                    max={listing.maxGuests}
                    defaultValue="2"
                    required
                  />
                </Field>
                <Field id="message" label="Mensaje">
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Hora estimada de llegada, dudas o necesidades especiales..."
                  />
                </Field>
                <label className="flex items-start gap-3 rounded-3xl bg-[#fbf7ef] p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    name="consent"
                    className="mt-1 size-4 accent-[#160f09]"
                    required
                  />
                  Acepto que WIAHost contacte conmigo para gestionar esta
                  solicitud de reserva.
                </label>
                <div className="rounded-3xl border border-[#dfd2bf] bg-[#fbf7ef] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Precio base</span>
                    <strong>{listing.basePrice} EUR/noche</strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>Limpieza</span>
                    <strong>{listing.cleaningFee} EUR</strong>
                  </div>
                  <p className="mt-3 text-xs text-[#75695b]">
                    El importe final depende de fechas, noches, impuestos y
                    condiciones antes de confirmar.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="h-12 rounded-full bg-[#160f09] text-white hover:bg-[#2b1d10]"
                >
                  Enviar solicitud
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-[#dfd2bf] bg-[#fbf7ef] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#75695b]">
        {Icon ? <Icon className="size-4" /> : null}
        {label}
      </div>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MiniTrust({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-[#f6efe4] px-3 py-2 text-xs font-semibold text-[#4f4538]">
      <CheckCircle2 className="size-4 text-emerald-700" />
      {text}
    </div>
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
