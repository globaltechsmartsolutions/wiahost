import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.52fr)] lg:items-end"
      data-testid="page-header"
    >
      <div>
        {eyebrow ? (
          <Badge
            variant="outline"
            className="mb-3 rounded-full bg-card/70 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em]"
          >
            {eyebrow}
          </Badge>
        ) : null}
        <h1 className="text-balance text-[1.85rem] font-semibold leading-[0.98] tracking-[-0.05em] sm:text-[2.25rem] lg:text-[2.45rem]">
          {title}
        </h1>
      </div>
      <p className="max-w-3xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base lg:mb-1 lg:max-w-md">
        {description}
      </p>
    </div>
  );
}
