import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { searchOperations } from "@/lib/data/search";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const results = await searchOperations(query);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Busqueda global"
        title="Encuentra cualquier operacion en segundos."
        description="Busca reservas, huespedes, propiedades, tareas, incidencias y conversaciones desde un unico punto."
      />

      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardContent className="p-5">
          <form action="/search" className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                className="h-11 rounded-full pl-10"
                defaultValue={query}
                name="q"
                placeholder="Busca por huesped, reserva, propiedad, tarea o incidencia..."
              />
            </div>
            <Button type="submit" className="h-11 rounded-full">
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="mt-5 grid gap-3">
        {query.length < 2 ? (
          <EmptyState
            title="Empieza con al menos dos caracteres"
            description="Por ejemplo: Sofia, Atico, limpieza, Airbnb o incidencia."
          />
        ) : results.length ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {results.length} resultados para &quot;{query}&quot;
              </p>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/dashboard">Volver al dashboard</Link>
              </Button>
            </div>
            {results.map((result) => (
              <Link key={`${result.type}-${result.id}`} href={result.href}>
                <Card className="rounded-[1.6rem] border-border/80 bg-card/80 transition hover:-translate-y-0.5 hover:bg-white/85">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-full bg-white/70"
                        >
                          {result.type}
                        </Badge>
                        {result.status ? (
                          <Badge className="rounded-full bg-[#d8ff74] text-[#160f09]">
                            {result.status}
                          </Badge>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-tight">
                        {result.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {result.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="size-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </>
        ) : (
          <EmptyState
            title="Sin resultados"
            description="No hemos encontrado coincidencias. Prueba con otro nombre, propiedad, canal o estado."
          />
        )}
      </section>
    </AppShell>
  );
}
