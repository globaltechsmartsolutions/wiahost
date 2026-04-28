import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateGuestAction } from "@/lib/actions/guests";
import { getGuestDetail } from "@/lib/data/guests";

type EditGuestPageProps = {
  params: Promise<{ guestId: string }>;
  searchParams: Promise<{ error?: string }>;
};

const languages = [
  { label: "Espanol", value: "es" },
  { label: "Ingles", value: "en" },
  { label: "Frances", value: "fr" },
  { label: "Aleman", value: "de" },
  { label: "Italiano", value: "it" },
  { label: "Portugues", value: "pt" },
];

export default async function EditGuestPage({
  params,
  searchParams,
}: EditGuestPageProps) {
  const [{ guestId }, { error }] = await Promise.all([params, searchParams]);
  const guest = await getGuestDetail(guestId);

  if (!guest) {
    notFound();
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          eyebrow="CRM de huespedes"
          title={`Editar ficha de ${guest.name}`}
          description="Mantiene actualizado el contexto que usara operaciones antes de responder, preparar una estancia o resolver una incidencia."
        />
        <Button
          asChild
          variant="outline"
          className="rounded-full border-[#dfd2bf] bg-white/70"
        >
          <Link href={`/guests/${guest.id}`}>Volver a la ficha</Link>
        </Button>
      </div>

      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Datos del huesped</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          <form action={updateGuestAction} className="grid gap-5">
            <input type="hidden" name="guestId" value={guest.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre" id="fullName">
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  defaultValue={guest.raw.fullName}
                />
              </Field>
              <Field label="Idioma preferido" id="preferredLanguage">
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  defaultValue={guest.raw.preferredLanguage}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {languages.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Email" id="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={guest.raw.email}
                />
              </Field>
              <Field label="Telefono" id="phone">
                <Input id="phone" name="phone" defaultValue={guest.raw.phone} />
              </Field>
            </div>

            <Field label="Notas internas" id="notes">
              <Textarea
                id="notes"
                name="notes"
                rows={6}
                defaultValue={guest.raw.notes}
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-full">
                Guardar huesped
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
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
