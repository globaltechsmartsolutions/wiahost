import Link from "next/link";
import { Bell, Building2, Search } from "lucide-react";

import { navigationItems } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-4 left-4 z-20 hidden w-64 flex-col rounded-[2rem] border border-border/80 bg-card/90 p-4 shadow-xl backdrop-blur xl:flex">
        <Link href="/" className="flex items-center gap-3 rounded-2xl px-3 py-2">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">WIAHost</span>
            <span className="block text-xs text-muted-foreground">PMS/CRM operativo</span>
          </span>
        </Link>

        <nav className="mt-8 grid gap-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-border/80 bg-background/60 p-4">
          <p className="text-sm font-medium">Modo demo</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Datos preparados para validar producto antes de conectar canales reales.
          </p>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-10 border-b border-border/70 bg-background/80 px-5 py-4 backdrop-blur lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <Link href="/" className="font-semibold xl:hidden">
              WIAHost
            </Link>
            <div className="relative hidden flex-1 md:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-10 rounded-full bg-card pl-9" placeholder="Buscar reserva, huésped, propiedad o tarea..." />
            </div>
            <Button variant="outline" size="icon" className="ml-auto rounded-full bg-card">
              <Bell className="size-4" />
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">Laura Operaciones</p>
              <p className="text-xs text-muted-foreground">Admin demo</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
