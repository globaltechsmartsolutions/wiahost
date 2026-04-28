import type { DashboardMetric } from "@wiahost/shared";

import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <Card className="h-full rounded-[1.75rem] border-border/80 bg-card/80 shadow-sm">
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">{metric.label}</p>
          {metric.trend ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
              {metric.trend}
            </span>
          ) : null}
        </div>
        <div>
          <p className="mt-6 text-4xl font-semibold tracking-tight">{metric.value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{metric.helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}
