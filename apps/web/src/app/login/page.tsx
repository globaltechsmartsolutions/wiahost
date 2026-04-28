import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-border/80 bg-card/90 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight">Entrar en WIAHost</CardTitle>
          <p className="text-sm text-muted-foreground">Accede al panel de operaciones demo.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="operaciones@wiahost.local" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Password123!" />
            </div>
            <Button className="h-11 w-full rounded-full" asChild>
              <Link href="/dashboard">Entrar al panel</Link>
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link href="/register" className="font-medium text-foreground">Crear demo</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
