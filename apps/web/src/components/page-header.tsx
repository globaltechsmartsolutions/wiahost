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
    <div className="mb-8">
      {eyebrow ? (
        <Badge variant="outline" className="mb-4 rounded-full bg-card/70 px-3 py-1">
          {eyebrow}
        </Badge>
      ) : null}
      <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-pretty text-muted-foreground sm:text-lg">{description}</p>
    </div>
  );
}
