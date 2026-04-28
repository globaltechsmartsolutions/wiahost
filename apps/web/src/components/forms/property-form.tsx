import { createPropertyAction } from "@/lib/actions/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PropertyForm({ error }: { error?: string }) {
  return (
    <Card className="rounded-[2rem] border-[#dfd2bf] bg-white/76 shadow-sm">
      <CardHeader>
        <CardTitle>Nueva propiedad</CardTitle>
        <p className="text-sm text-[#75695b]">
          Crea el activo base. Los listings por canal, fotos y reglas avanzadas vendrán después.
        </p>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        <form action={createPropertyAction} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre comercial</Label>
              <Input id="name" name="name" required placeholder="Atico Gran Via Sky" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalName">Código interno</Label>
              <Input id="internalName" name="internalName" placeholder="MAD-GV-01" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={4} placeholder="Alojamiento premium con llegada autonoma..." />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addressLine">Dirección</Label>
              <Input id="addressLine" name="addressLine" required placeholder="Gran Via 28" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" required placeholder="Madrid" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" name="province" placeholder="Madrid" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input id="country" name="country" defaultValue="Spain" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Dormitorios</Label>
              <Input id="bedrooms" name="bedrooms" type="number" min="0" defaultValue="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Baños</Label>
              <Input id="bathrooms" name="bathrooms" type="number" min="0" step="0.5" defaultValue="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGuests">Huéspedes</Label>
              <Input id="maxGuests" name="maxGuests" type="number" min="1" defaultValue="2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice">Precio base</Label>
              <Input id="basePrice" name="basePrice" type="number" min="0" defaultValue="120" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaningFee">Limpieza</Label>
              <Input id="cleaningFee" name="cleaningFee" type="number" min="0" defaultValue="40" />
            </div>
          </div>

          <input type="hidden" name="status" value="active" />

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" className="rounded-full bg-[#160f09] px-6 text-white hover:bg-[#2b1d10]">
              Guardar propiedad
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
