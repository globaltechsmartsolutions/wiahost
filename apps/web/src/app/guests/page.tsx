import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

const guests = [
  ["Sofía Martín", "sofia@example.com", "Repetidora", "Próxima llegada mañana"],
  ["James Walker", "james@example.com", "VIP", "En estancia"],
  ["Marta Costa", "marta@example.com", "Familia", "Pendiente de cuna"],
];

export default function GuestsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="CRM de huéspedes"
        title="Historial, preferencias y contexto antes de responder."
        description="El objetivo es que cada interacción tenga contexto: idioma, reservas, incidencias, pagos, reviews y etiquetas."
      />
      <section className="grid gap-4 md:grid-cols-3">
        {guests.map(([name, email, tag, note]) => (
          <Card key={email} className="rounded-[2rem] border-border/80 bg-card/80">
            <CardContent className="p-5">
              <p className="text-2xl font-semibold tracking-tight">{name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{email}</p>
              <div className="mt-6 rounded-3xl bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{tag}</p>
                <p className="mt-3 text-sm">{note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
