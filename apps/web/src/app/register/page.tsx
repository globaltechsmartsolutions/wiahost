import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-lg rounded-[2rem] border-border/80 bg-card/90 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight">Crear espacio WIAHost</CardTitle>
          <p className="text-sm text-muted-foreground">Primer flujo de alta preparado para conectar Supabase Auth.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre</Label>
              <Input id="fullName" placeholder="Laura Operaciones" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" />
            </div>
            <Button className="h-11 rounded-full" asChild>
              <Link href="/dashboard">Crear demo y entrar</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
