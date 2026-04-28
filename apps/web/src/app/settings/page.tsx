import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Configuración"
        title="Canales, usuarios, automatizaciones e integraciones."
        description="Aquí conectaremos cuentas de canales, WhatsApp, pagos, smart locks, pricing dinámico, web directa y permisos por equipo."
      />
      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardContent className="grid gap-4 p-5 md:grid-cols-2">
          {[
            "Canales: Airbnb, Booking, Vrbo, Expedia",
            "Mensajería: WhatsApp, email, inbox web",
            "Pagos: Stripe, Redsys, transferencias",
            "Automatizaciones: check-in, checkout, limpieza",
            "Roles: admin, operaciones, propietario, limpieza",
            "Storage: fotos, documentos y evidencias",
          ].map((item) => (
            <div key={item} className="rounded-3xl border border-border/80 bg-background/60 p-4 text-sm font-medium">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
