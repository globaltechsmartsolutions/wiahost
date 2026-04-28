import { createPropertyAction, updatePropertyAction } from "@/lib/actions/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PropertyFormValues = {
  id?: string;
  addressLine?: string;
  bathrooms?: number;
  basePrice?: number;
  bedrooms?: number;
  city?: string;
  cleaningFee?: number;
  country?: string;
  description?: string;
  internalName?: string;
  maxGuests?: number;
  name?: string;
  province?: string;
  statusValue?: string;
};

type PropertyFormProps = {
  error?: string;
  initialValues?: PropertyFormValues;
  mode?: "create" | "edit";
};

const statuses = [
  { label: "Borrador", value: "draft" },
  { label: "Activa", value: "active" },
  { label: "Pausada", value: "paused" },
  { label: "Archivada", value: "archived" },
];

export function PropertyForm({ error, initialValues, mode = "create" }: PropertyFormProps) {
  const isEdit = mode === "edit";
  const action = isEdit ? updatePropertyAction : createPropertyAction;

  return (
    <Card className="rounded-[2rem] border-[#dfd2bf] bg-white/76 shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "Editar propiedad" : "Nueva propiedad"}</CardTitle>
        <p className="text-sm text-[#75695b]">
          {isEdit
            ? "Actualiza los datos operativos del activo sin romper reservas, tareas o canales asociados."
            : "Crea el activo base. Los listings por canal, fotos y reglas avanzadas vendran despues."}
        </p>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        <form action={action} className="grid gap-5">
          {isEdit ? <input type="hidden" name="propertyId" value={initialValues?.id} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre comercial</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initialValues?.name ?? ""}
                placeholder="Atico Gran Via Sky"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalName">Codigo interno</Label>
              <Input
                id="internalName"
                name="internalName"
                defaultValue={initialValues?.internalName ?? ""}
                placeholder="MAD-GV-01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={initialValues?.description ?? ""}
              placeholder="Alojamiento premium con llegada autonoma..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addressLine">Direccion</Label>
              <Input
                id="addressLine"
                name="addressLine"
                required
                defaultValue={initialValues?.addressLine ?? ""}
                placeholder="Gran Via 28"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" required defaultValue={initialValues?.city ?? ""} placeholder="Madrid" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" name="province" defaultValue={initialValues?.province ?? ""} placeholder="Madrid" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pais</Label>
              <Input id="country" name="country" defaultValue={initialValues?.country ?? "Spain"} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Dormitorios</Label>
              <Input id="bedrooms" name="bedrooms" type="number" min="0" defaultValue={initialValues?.bedrooms ?? 1} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Banos</Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min="0"
                step="0.5"
                defaultValue={initialValues?.bathrooms ?? 1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGuests">Huespedes</Label>
              <Input id="maxGuests" name="maxGuests" type="number" min="1" defaultValue={initialValues?.maxGuests ?? 2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice">Precio base</Label>
              <Input id="basePrice" name="basePrice" type="number" min="0" defaultValue={initialValues?.basePrice ?? 120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaningFee">Limpieza</Label>
              <Input
                id="cleaningFee"
                name="cleaningFee"
                type="number"
                min="0"
                defaultValue={initialValues?.cleaningFee ?? 40}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              name="status"
              defaultValue={initialValues?.statusValue ?? "active"}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" className="rounded-full bg-[#160f09] px-6 text-white hover:bg-[#2b1d10]">
              {isEdit ? "Guardar cambios" : "Guardar propiedad"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
