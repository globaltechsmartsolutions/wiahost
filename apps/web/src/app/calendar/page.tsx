import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCalendarBlockAction } from "@/lib/actions/calendar";
import {
  getDashboardData,
  getOperationFormOptions,
} from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams?: Promise<{ created?: string; error?: string }>;
};

function cellTone(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("check-in")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-950";
  }

  if (normalized.includes("check-out")) {
    return "border-blue-300 bg-blue-50 text-blue-950";
  }

  if (normalized.includes("bloqueo")) {
    return "border-red-300 bg-red-50 text-red-950";
  }

  if (normalized.includes("ocupado")) {
    return "border-[#dfd2bf] bg-[#efe2cc] text-[#1b130c]";
  }

  return "border-[#dfd2bf] bg-background/70 text-muted-foreground";
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const [data, options, params] = await Promise.all([
    getDashboardData(),
    getOperationFormOptions(),
    searchParams,
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Calendario multi-propiedad"
        title="Disponibilidad, reservas y tareas en una parrilla operativa."
        description="Vista real de disponibilidad por propiedad, alimentada por reservas y preparada para bloqueos manuales y sincronizacion OTA."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Bloqueo creado correctamente.
        </div>
      ) : null}

      <Card className="rounded-[1.6rem] border-border/80 bg-card/80">
        <CardContent className="p-4">
          <form
            action={createCalendarBlockAction}
            className="grid gap-3 lg:grid-cols-[1fr_0.7fr_0.7fr_1fr_auto] lg:items-end"
          >
            <div className="grid gap-2">
              <Label htmlFor="propertyId">Propiedad</Label>
              <select
                id="propertyId"
                name="propertyId"
                required
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              >
                {options.properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Desde</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">Hasta</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                name="reason"
                placeholder="Mantenimiento, owner stay..."
                required
              />
            </div>
            <Button type="submit" className="rounded-full">
              Crear bloqueo
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[220px_repeat(7,1fr)] border-b border-border/80">
                <div className="p-4 text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                  Propiedad
                </div>
                {data.calendarDays.map((day) => (
                  <div
                    key={`${day.day}-${day.date}`}
                    className="border-l border-border/80 p-4 text-center"
                  >
                    <p className="text-sm text-muted-foreground">{day.day}</p>
                    <p className="text-2xl font-semibold">{day.date}</p>
                  </div>
                ))}
              </div>
              {data.calendarMatrix.map((row) => (
                <div
                  key={row.code}
                  className="grid grid-cols-[220px_repeat(7,1fr)] border-b border-border/70 last:border-b-0"
                >
                  <div className="p-4">
                    <p className="font-semibold">{row.property}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.code}
                    </p>
                  </div>
                  {row.cells.map((cell, index) => (
                    <div
                      key={`${row.code}-${index}`}
                      className="border-l border-border/70 p-3"
                    >
                      <div
                        className={`min-h-16 rounded-2xl border p-3 text-sm font-semibold ${cellTone(cell)}`}
                      >
                        {cell}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
