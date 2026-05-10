"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface TrendPoint {
  periodName: string;
  allocated: number;
  spent: number;
}

interface Props {
  categoryName: string;
  data: TrendPoint[];
}

export function CategoryTrendChart({ categoryName, data }: Props) {
  const max = Math.max(...data.flatMap((d) => [d.allocated, d.spent]), 1);

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-medium">{categoryName} Trend</h3>
        {data.length > 1 ? (
          <>
            {/* Bar chart representation */}
            <div className="flex items-end gap-1.5 h-40 px-1">
              {data.map((point) => {
                const allocH = (point.allocated / max) * 100;
                const spentH = (point.spent / max) * 100;
                const over = point.spent > point.allocated;
                return (
                  <div
                    key={point.periodName}
                    className="flex-1 flex items-end gap-0.5 min-w-0 group relative"
                  >
                    <div
                      className="flex-1 rounded-t bg-muted-foreground/15 transition-all"
                      style={{ height: `${allocH}%` }}
                    />
                    <div
                      className={`flex-1 rounded-t transition-all ${over ? "bg-red-500/80" : "bg-primary/80"}`}
                      style={{ height: `${spentH}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-popover text-popover-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-md whitespace-nowrap">
                        <p className="font-medium">{point.periodName}</p>
                        <p>Allocated: {formatCurrency(point.allocated)}</p>
                        <p>Spent: {formatCurrency(point.spent)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex gap-1.5 px-1">
              {data.map((point) => (
                <div
                  key={point.periodName}
                  className="flex-1 text-center text-[10px] text-muted-foreground truncate"
                >
                  {point.periodName.length > 8
                    ? point.periodName.slice(0, 6) + "..."
                    : point.periodName}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-4 rounded bg-primary/80" />
                Spent
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-4 rounded bg-muted-foreground/15" />
                Allocated
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {data.length === 1
              ? "Only one period available - need more data for a trend"
              : "No data available for this category"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
