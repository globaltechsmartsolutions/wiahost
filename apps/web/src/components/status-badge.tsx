import { Badge } from "@/components/ui/badge";

const toneByValue: Record<string, string> = {
  Activo: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Archivado: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Borrador: "border-amber-300 bg-amber-50 text-amber-800",
  Confirmada: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "En estancia": "border-blue-300 bg-blue-50 text-blue-800",
  Pendiente: "border-amber-300 bg-amber-50 text-amber-800",
  Pausado: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Urgente: "border-red-300 bg-red-50 text-red-800",
  Alta: "border-red-300 bg-red-50 text-red-800",
  Media: "border-amber-300 bg-amber-50 text-amber-800",
  Abierta: "border-red-300 bg-red-50 text-red-800",
  Investigando: "border-blue-300 bg-blue-50 text-blue-800",
  Programada: "border-blue-300 bg-blue-50 text-blue-800",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={`rounded-full ${toneByValue[value] ?? "bg-muted text-muted-foreground"}`}>
      {value}
    </Badge>
  );
}
