import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { calendarDays, properties } from "@/lib/demo-data";

export default function CalendarPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Calendario multi-propiedad"
        title="Disponibilidad, reservas y tareas en una parrilla operativa."
        description="El calendario será el centro para sincronizar Airbnb, Booking, Vrbo, web directa y bloqueos manuales."
      />
      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardContent className="p-5">
          <div className="grid gap-3 lg:grid-cols-7">
            {calendarDays.map((day) => (
              <div key={day.date} className="rounded-3xl border border-border/80 bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">{day.day}</p>
                <p className="mt-1 text-3xl font-semibold">{day.date}</p>
                <div className="mt-5 space-y-2">
                  {properties.map((property, index) => (
                    <div key={property.id} className="rounded-2xl bg-card px-3 py-2 text-xs shadow-sm">
                      <span className="font-semibold">{property.internalName ?? property.id}</span>
                      <span className="block text-muted-foreground">{day.events[index % day.events.length]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
