"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ErrorState({
  description = "Ha ocurrido algo inesperado. Puedes reintentar sin perder el contexto de trabajo.",
  digest,
  onRetry,
  title = "No hemos podido cargar esta vista",
}: {
  description?: string;
  digest?: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[#e3d6c4] bg-card/85 p-6 text-center shadow-sm md:p-8">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight md:text-2xl">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {digest ? (
        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Código de seguimiento: {digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Reintentar
          </Button>
        ) : null}
        <Button asChild type="button" variant="outline">
          <Link href="/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
