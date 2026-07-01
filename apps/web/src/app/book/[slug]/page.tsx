import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Home,
  MapPin,
  MessageCircle,
  ShieldCheck,
  WalletCards,
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
    checkIn?: string;
    checkOut?: string;
    error?: string;
    guests?: string;
    listingId?: string;
    sent?: string;
  }>;
};

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const listing = await requirePublicBookingListing(slug);
  const nights = nightsBetween(query?.checkIn ?? "", query?.checkOut ?? "");
  const totalEstimate =
    nights > 0 ? listing.basePrice * nights + listing.cleaningFee : null;
  const guests = Number.parseInt(query?.guests ?? "", 10);
  const defaultGuests =
    Number.isFinite(guests) && guests > 0
      ? Math.min(guests, listing.maxGuests)
      : 2;
  const heroStyle = listing.thumbnailUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(11, 8, 5, 0.12), rgba(11, 8, 5, 0.82)), url("${listing.thumbnailUrl}")`,
      }
    : {
        backgroundImage:
          "radial-gradient(circle at 22% 18%, #d8ff74 0, #d8ff74 16%, transparent 17%), linear-gradient(135deg, #14100b, #3a2f18)",
      };

  return (
    <main className="min-h-screen bg-[#f4f0e8] text-[#17130d]">
      <section className="mx-auto grid min-h-screen max-w-[1280px] gap-5 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)] lg:px-8">
        <div className="flex flex-col gap-5 lg:h-full">
          <nav className="flex items-center justify-between rounded-lg border border-[#ddd2c2] bg-white/85 px-3 py-3 shadow-sm backdrop-blur-xl sm:px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#17130d] text-[#d8ff74]">
                <Home className="size-4" />
              </span>
              WIAHost
            </Link>
            <Button
              asChild
              variant="outline"
              className="rounded-lg border-[#ddd2c2] bg-white/70"
            >
              <Link href="/">
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            </Button>
          </nav>

          <Card className="overflow-hidden rounded-lg border-[#ddd2c2] bg-white shadow-sm">
            <div
              className="min-h-[340px] bg-cover bg-center p-5 text-white sm:p-6"
              style={heroStyle}
            >
              <div className="flex h-full min-h-[292px] flex-col justify-end">
                <p className="mb-3 inline-flex w-fit rounded-full border border-white/20 bg-black/28 px-3 py-1 text-xs font-semibold uppercase text-white/88 backdrop-blur">
                  Reserva directa gestionada por WIAHost
                </p>
                <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[0.98] sm:text-5xl">
                  {listing.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/82">
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur">
                    <MapPin className="size-4" />
                    {listing.address}
                  </span>
                  <span className="rounded-full bg-[#d8ff74] px-3 py-1.5 font-semibold text-[#17130d]">
                    Desde {formatCurrency(listing.basePrice)} / noche
                  </span>
                </div>
              </div>
            </div>
            <CardContent className="grid gap-3 border-t border-[#e7dece] bg-[#fffdf8] p-4 sm:grid-cols-2 xl:grid-cols-4">
              <Fact
                icon={Users}
                label="Huespedes"
                value={`Hasta ${listing.maxGuests}`}
                helper="capacidad maxima"
              />
              <Fact
                icon={BedDouble}
                label="Dormitorios"
                value={String(listing.bedrooms)}
                helper={listing.bedrooms === 1 ? "habitacion" : "habitaciones"}
              />
              <Fact
                icon={Bath}
                label="Banos"
                value={String(listing.bathrooms)}
                helper="completos"
              />
              <Fact
                icon={CalendarDays}
                label="Desde"
                value={formatCurrency(listing.basePrice)}
                helper="por noche"
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-[#ddd2c2] bg-white/88 shadow-sm lg:flex-1">
            <CardHeader>
              <CardTitle className="text-xl">
                Informacion del alojamiento
              </CardTitle>
              <CardDescription>
                Solicitud directa sin comisiones de portal. El equipo revisa
                disponibilidad y confirma manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm leading-7 text-[#63594c]">
              <p>{listing.description}</p>
              <div className="rounded-lg border border-[#e0d6c8] bg-[#fbf8f1] p-4">
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
              <div className="grid gap-3 border-t border-[#e7dece] pt-5 md:grid-cols-3">
                <ProcessStep
                  icon={ClipboardCheck}
                  label="Revision"
                  text="Validamos disponibilidad, estancia minima y condiciones."
                />
                <ProcessStep
                  icon={MessageCircle}
                  label="Respuesta"
                  text="Centralizamos la conversacion y resolvemos dudas antes de confirmar."
                />
                <ProcessStep
                  icon={WalletCards}
                  label="Pago"
                  text="El pago se prepara solo cuando la reserva esta aprobada."
                />
              </div>
              <div className="rounded-lg bg-[#17130d] p-4 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="size-4 text-[#d8ff74]" />
                  Seguimiento interno
                </div>
                <p className="mt-2 text-xs leading-5 text-white/70">
                  La solicitud queda vinculada al anuncio, al huesped y a la
                  conversacion para que operaciones pueda revisar cada paso.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-5 lg:self-stretch">
          <Card className="h-full rounded-lg border-[#d8ccbb] bg-white shadow-xl shadow-[#2a1d0d]/10">
            <CardHeader className="border-b border-[#ece3d4] bg-[#fffdf8] px-5 py-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#17130d] px-3 py-1 text-xs font-semibold uppercase text-[#d8ff74]">
                  Sin cobro ahora
                </span>
                <span className="text-sm font-semibold text-[#5f6f30]">
                  Respuesta manual
                </span>
              </div>
              <CardTitle className="text-2xl">Solicitar reserva</CardTitle>
              <CardDescription>
                No se cobra nada ahora. Te responderemos para confirmar
                disponibilidad, precio final e instrucciones.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col px-5 pb-5">
              {query?.error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {query.error}
                </div>
              ) : null}
              {query?.sent ? (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Solicitud enviada. El equipo la revisara y te respondera
                  pronto.
                </div>
              ) : null}

              <div className="mb-5 grid gap-2 rounded-lg border border-[#e0d6c8] bg-[#fbf8f1] p-4 text-sm">
                <SummaryRow
                  label="Fechas"
                  value={formatStay(query?.checkIn, query?.checkOut)}
                />
                <SummaryRow label="Huespedes" value={`${defaultGuests}`} />
                <SummaryRow
                  label="Estimacion"
                  value={
                    totalEstimate ? formatCurrency(totalEstimate) : "Pendiente"
                  }
                />
              </div>

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
                    className="h-11 rounded-lg bg-white"
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
                      className="h-11 rounded-lg bg-white"
                      placeholder="tu@email.com"
                    />
                  </Field>
                  <Field id="guestPhone" label="Telefono">
                    <Input
                      id="guestPhone"
                      name="guestPhone"
                      className="h-11 rounded-lg bg-white"
                      placeholder="+34 600 000 000"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="checkIn" label="Entrada">
                    <Input
                      id="checkIn"
                      name="checkIn"
                      type="date"
                      defaultValue={query?.checkIn ?? ""}
                      required
                      className="h-11 rounded-lg bg-white"
                    />
                  </Field>
                  <Field id="checkOut" label="Salida">
                    <Input
                      id="checkOut"
                      name="checkOut"
                      type="date"
                      defaultValue={query?.checkOut ?? ""}
                      required
                      className="h-11 rounded-lg bg-white"
                    />
                  </Field>
                </div>
                <Field id="guestsCount" label="Numero de huespedes">
                  <Input
                    id="guestsCount"
                    name="guestsCount"
                    type="number"
                    min="1"
                    max={listing.maxGuests}
                    defaultValue={defaultGuests}
                    required
                    className="h-11 rounded-lg bg-white"
                  />
                </Field>
                <Field id="message" label="Mensaje">
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="min-h-24 rounded-lg bg-white"
                    placeholder="Hora estimada de llegada, dudas o necesidades especiales..."
                  />
                </Field>
                <label className="flex items-start gap-3 rounded-lg border border-[#e0d6c8] bg-[#fbf8f1] p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    name="consent"
                    className="mt-1 size-4 accent-[#160f09]"
                    required
                  />
                  Acepto que WIAHost contacte conmigo para gestionar esta
                  solicitud de reserva.
                </label>
                <div className="rounded-lg border border-[#e0d6c8] bg-[#fbf8f1] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Precio base</span>
                    <strong>{formatCurrency(listing.basePrice)} / noche</strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>Limpieza</span>
                    <strong>{formatCurrency(listing.cleaningFee)}</strong>
                  </div>
                  {totalEstimate ? (
                    <div className="mt-3 flex items-center justify-between border-t border-[#e0d6c8] pt-3 text-sm">
                      <span>Estimacion</span>
                      <strong>{formatCurrency(totalEstimate)}</strong>
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs text-[#75695b]">
                    El importe final depende de fechas, noches, impuestos y
                    condiciones antes de confirmar.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="h-12 rounded-lg bg-[#17130d] text-white hover:bg-[#2b1d10]"
                >
                  Enviar solicitud
                </Button>
              </form>
              <div className="mt-4 rounded-lg border border-[#e0d6c8] bg-[#fbf8f1] px-4 py-3 text-xs leading-5 text-[#66584a]">
                Esta solicitud entra como consulta operativa; el equipo valida
                fechas y condiciones antes de confirmar cualquier reserva.
              </div>
              <div className="mt-5 grid gap-2 text-xs text-[#66584a] sm:grid-cols-3 lg:mt-auto lg:pt-5">
                <TrustPoint icon={ShieldCheck} text="Datos protegidos" />
                <TrustPoint icon={MessageCircle} text="Inbox centralizado" />
                <TrustPoint icon={CreditCard} text="Pago despues" />
              </div>
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
  helper,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#e0d6c8] bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase text-[#75695b]">
        {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
        <span data-booking-fact-label>{label}</span>
      </div>
      <p
        data-booking-fact-value
        className="mt-2 whitespace-nowrap text-xl font-semibold leading-none"
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[#8a7c6a]">{helper}</p>
    </div>
  );
}

function MiniTrust({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[#eef3df] px-3 py-2 text-xs font-semibold text-[#3f4c27]">
      <CheckCircle2 className="size-4 shrink-0 text-[#607a2c]" />
      {text}
    </div>
  );
}

function ProcessStep({
  icon: Icon,
  label,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-[#e0d6c8] bg-[#fffdf8] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#17130d]">
        <Icon className="size-4 shrink-0 text-[#5f6f30]" />
        {label}
      </div>
      <p className="mt-3 text-xs leading-5 text-[#66584a]">{text}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#75695b]">{label}</span>
      <strong className="text-right font-semibold text-[#17130d]">
        {value}
      </strong>
    </div>
  );
}

function TrustPoint({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[#f4f0e8] px-3 py-2">
      <Icon className="size-3.5 shrink-0 text-[#5f6f30]" />
      <span>{text}</span>
    </div>
  );
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("es-ES")} EUR`;
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function formatStay(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) {
    return "Pendiente";
  }

  return `${checkIn} -> ${checkOut}`;
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
      <Label htmlFor={id} className="text-sm font-semibold text-[#3d3328]">
        {label}
      </Label>
      {children}
    </div>
  );
}
