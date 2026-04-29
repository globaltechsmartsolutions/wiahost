import Link from "next/link";
import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { z } from "zod";

import { confirmCheckoutAction } from "@/lib/actions/checkout";
import { getPublicCheckoutPayment } from "@/lib/data/payments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  params: Promise<{ paymentId: string }>;
  searchParams?: Promise<{
    error?: string;
    paid?: string;
    token?: string;
  }>;
};

const idSchema = z.guid();

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const [{ paymentId }, query] = await Promise.all([params, searchParams]);
  const validPaymentId = idSchema.safeParse(paymentId);
  const token = query?.token ?? "";
  const payment = validPaymentId.success
    ? await getPublicCheckoutPayment(validPaymentId.data, token)
    : null;

  return (
    <main className="min-h-screen bg-[#f6efe4] px-4 py-8 text-[#1b130b]">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] bg-[#160f09] p-6 text-white shadow-2xl md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold">
            <ShieldCheck className="size-4 text-[#d8ff74]" />
            Checkout seguro WIAHost
          </div>
          <h1 className="mt-8 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            Confirma tu reserva directa en un entorno preparado para Stripe.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/72">
            Este MVP usa un checkout demo trazable. En producción, este paso se
            conectará a Stripe Checkout manteniendo el mismo flujo para el
            huésped y el equipo operativo.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/76 sm:grid-cols-3">
            <MiniStep label="01" text="Enlace tokenizado" />
            <MiniStep label="02" text="Pago confirmado" />
            <MiniStep label="03" text="Reserva actualizada" />
          </div>
        </div>

        <Card className="rounded-[2rem] border-[#dfd2bf] bg-[#fffaf2] shadow-xl">
          <CardHeader>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#d8ff74] text-[#160f09]">
              {query?.paid ? (
                <CheckCircle2 className="size-6" />
              ) : (
                <CreditCard className="size-6" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {query?.paid ? "Pago confirmado" : "Resumen del pago"}
            </CardTitle>
            <CardDescription>
              {payment
                ? "Revisa el importe antes de confirmar."
                : "El enlace no existe, ha caducado o no coincide con el token."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {query?.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {query.error}
              </div>
            ) : null}

            {payment ? (
              <>
                <div className="rounded-3xl border border-[#dfd2bf] bg-white/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#75695b]">
                    Importe
                  </p>
                  <p className="mt-3 text-4xl font-semibold">
                    {payment.amount}
                  </p>
                </div>
                <div className="grid gap-3 text-sm">
                  <Fact label="Huésped" value={payment.guest} />
                  <Fact label="Alojamiento" value={payment.property} />
                  <Fact label="Fechas" value={payment.dates} />
                  <Fact label="Estado" value={payment.status} />
                </div>

                {payment.raw.status === "paid" || query?.paid ? (
                  <Button asChild className="rounded-full">
                    <Link href="/">Volver a WIAHost</Link>
                  </Button>
                ) : (
                  <form action={confirmCheckoutAction} className="grid gap-3">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <input type="hidden" name="token" value={token} />
                    <Button type="submit" className="rounded-full">
                      Confirmar pago demo
                    </Button>
                    <p className="text-xs leading-5 text-[#75695b]">
                      El cargo real se conectará mediante Stripe Checkout y
                      webhook de confirmación antes de producción.
                    </p>
                  </form>
                )}
              </>
            ) : (
              <Button asChild className="rounded-full">
                <Link href="/">Volver al inicio</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function MiniStep({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
      <p className="text-xs font-bold text-[#d8ff74]">{label}</p>
      <p className="mt-2 font-medium">{text}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#dfd2bf] bg-white/60 px-4 py-3">
      <span className="text-[#75695b]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
