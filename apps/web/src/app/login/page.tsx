import Link from "next/link";

import { signInAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; success?: string }>;
}) {
  const { error, next, success } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-border/80 bg-card/90 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight">Entrar en WIAHost</CardTitle>
          <p className="text-sm text-muted-foreground">Accede al panel de operaciones.</p>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          ) : null}
          <form action={signInAction} className="space-y-4">
            <input type="hidden" name="next" value={next ?? "/dashboard"} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="operaciones@wiahost.local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Password123!" required />
            </div>
            <Button type="submit" className="h-11 w-full rounded-full">
              Entrar al panel
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link href="/register" className="font-medium text-foreground">Crear espacio</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
