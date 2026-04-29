import { Badge } from "@/components/ui/badge";

const toneByValue: Record<string, string> = {
  Activo: "border-emerald-300 bg-emerald-50 text-emerald-800",
  OK: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Aviso: "border-amber-300 bg-amber-50 text-amber-800",
  Error: "border-red-300 bg-red-50 text-red-800",
  Archivado: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Borrador: "border-amber-300 bg-amber-50 text-amber-800",
  Bloqueada: "border-amber-300 bg-amber-50 text-amber-800",
  Publicado: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "Error sync": "border-red-300 bg-red-50 text-red-800",
  Sincronizado: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Sincronizada: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Fallido: "border-red-300 bg-red-50 text-red-800",
  Fallida: "border-red-300 bg-red-50 text-red-800",
  Ignorado: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Ignorada: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Confirmada: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "Completada a tiempo": "border-emerald-300 bg-emerald-50 text-emerald-800",
  "Completada tarde": "border-red-300 bg-red-50 text-red-800",
  Consulta: "border-blue-300 bg-blue-50 text-blue-800",
  "En estancia": "border-blue-300 bg-blue-50 text-blue-800",
  Pendiente: "border-amber-300 bg-amber-50 text-amber-800",
  Autorizado: "border-blue-300 bg-blue-50 text-blue-800",
  Pagado: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "Enlace listo": "border-emerald-300 bg-emerald-50 text-emerald-800",
  "Sin enlace": "border-zinc-300 bg-zinc-50 text-zinc-700",
  Reservado: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "Sin leer": "border-amber-300 bg-amber-50 text-amber-800",
  Leida: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Visto: "border-blue-300 bg-blue-50 text-blue-800",
  Perdido: "border-red-300 bg-red-50 text-red-800",
  Cancelado: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Desconocido: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Pausado: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Urgente: "border-red-300 bg-red-50 text-red-800",
  Alta: "border-red-300 bg-red-50 text-red-800",
  Media: "border-amber-300 bg-amber-50 text-amber-800",
  Operativo: "border-blue-300 bg-blue-50 text-blue-800",
  Abierta: "border-red-300 bg-red-50 text-red-800",
  Investigando: "border-blue-300 bg-blue-50 text-blue-800",
  Programada: "border-blue-300 bg-blue-50 text-blue-800",
  Baja: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Critica: "border-red-300 bg-red-50 text-red-800",
  Humana: "border-blue-300 bg-blue-50 text-blue-800",
  Importacion: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Mixto: "border-amber-300 bg-amber-50 text-amber-800",
  Modelo: "border-sky-300 bg-sky-50 text-sky-800",
  Negativo: "border-red-300 bg-red-50 text-red-800",
  Neutral: "border-zinc-300 bg-zinc-50 text-zinc-700",
  Positivo: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Regla: "border-amber-300 bg-amber-50 text-amber-800",
  "Sin clasificar": "border-zinc-300 bg-zinc-50 text-zinc-700",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full ${toneByValue[value] ?? "bg-muted text-muted-foreground"}`}
    >
      {value}
    </Badge>
  );
}
