import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/lib/actions/settings";
import { getSettingsData } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Promise<{ error?: string; updated?: string }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const [data, params] = await Promise.all([getSettingsData(), searchParams]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Configuracion"
        title="Canales, usuarios, automatizaciones e integraciones."
        description="Configura tu perfil operativo y revisa que piezas del PMS estan activas o preparadas."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Perfil actualizado correctamente.
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Perfil operativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Nombre</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  defaultValue={data.profile.fullName}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={data.profile.email} readOnly />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={data.profile.phone}
                  placeholder="+34..."
                />
              </div>
              <div className="rounded-3xl border border-border/80 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Rol
                </p>
                <p className="mt-2 font-semibold">{data.profile.role}</p>
              </div>
              <Button type="submit" className="rounded-full">
                Guardar perfil
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Integraciones y modulos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {data.integrations.map((integration) => (
              <div
                key={integration.label}
                className="rounded-3xl border border-border/80 bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{integration.label}</p>
                  <StatusBadge value={integration.status} />
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Readiness tecnico</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.systemHealth.map((check) => (
            <div
              key={check.label}
              className="rounded-3xl border border-border/80 bg-background/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{check.label}</p>
                <StatusBadge value={check.status} />
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {check.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
