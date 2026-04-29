import { Loader2 } from "lucide-react";

export function LoadingState({
  description = "Estamos preparando los datos de la operación.",
  title = "Cargando WIAHost",
}: {
  description?: string;
  title?: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-card/80 p-6 text-center shadow-sm md:p-8">
      <Loader2 className="mx-auto size-7 animate-spin text-[#160f09]" />
      <h3 className="mt-4 text-base font-semibold md:text-lg">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
