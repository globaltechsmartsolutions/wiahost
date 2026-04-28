import Link from "next/link";

import { signUpAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-lg rounded-[2rem] border-border/80 bg-card/90 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight">Crear espacio WIAHost</CardTitle>
          <p className="text-sm text-muted-foreground">Alta con Supabase Auth y perfil de equipo.</p>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          <form action={signUpAction} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre</Label>
              <Input id="fullName" name="fullName" autoComplete="name" placeholder="Laura Operaciones" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                name="role"
                defaultValue="operator"
                className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="operator">Operaciones</option>
                <option value="owner">Propietario</option>
                <option value="housekeeping">Limpieza</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" className="h-11 rounded-full">
              Crear cuenta
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link href="/login" className="font-medium text-foreground">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
