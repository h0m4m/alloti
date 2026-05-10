"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface MonthlyEntry {
  name: string;
  budget: number;
  spent: number;
  remaining: number;
}

interface Props {
  data: MonthlyEntry[];
}

export function MonthlyComparisonChart({ data }: Props) {
  const max = Math.max(...data.flatMap((d) => [d.budget, d.spent]), 1);

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-medium">Monthly Comparison</h3>
        {data.length > 0 ? (
          <>
            {/* Vertical bars */}
            <div className="flex items-end gap-1.5 h-40 px-1">
              {data.map((entry) => {
                const budgetH = (entry.budget / max) * 100;
                const spentH = (entry.spent / max) * 100;
                const over = entry.spent > entry.budget;
                return (
                  <div
                    key={entry.name}
                    className="flex-1 flex items-end gap-0.5 min-w-0 group relative"
                  >
                    {/* Budget bar */}
                    <div
                      className="flex-1 rounded-t bg-muted-foreground/15 transition-all"
                      style={{ height: `${budgetH}%` }}
                    />
                    {/* Spent bar */}
                    <div
                      className={`flex-1 rounded-t transition-all ${over ? "bg-red-500/80" : "bg-primary/80"}`}
                      style={{ height: `${spentH}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-popover text-popover-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-md whitespace-nowrap">
                        <p className="font-medium">{entry.name}</p>
                        <p>Budget: {formatCurrency(entry.budget)}</p>
                        <p>Spent: {formatCurrency(entry.spent)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex gap-1.5 px-1">
              {data.map((entry) => (
                <div
                  key={entry.name}
                  className="flex-1 text-center text-[10px] text-muted-foreground truncate"
                >
                  {entry.name.length > 8
                    ? entry.name.slice(0, 6) + "..."
                    : entry.name}
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
                Budget
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Not enough data for comparison
          </p>
        )}
      </CardContent>
    </Card>
  );
}
