"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface CategoryData {
  name: string;
  color: string;
  planned: number;
  actual: number;
  difference: number;
}

interface Props {
  periodName: string;
  totalPlanned: number;
  totalActual: number;
  totalDifference: number;
  categories: CategoryData[];
}

export function BudgetVsActualChart({
  periodName,
  totalPlanned,
  totalActual,
  totalDifference,
  categories,
}: Props) {
  const max = Math.max(...categories.flatMap((c) => [c.planned, c.actual]), 1);

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Budget vs Actual</h3>
          <span className="text-xs text-muted-foreground">{periodName}</span>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-base font-bold">{formatCurrency(totalPlanned)}</p>
            <p className="text-xs text-muted-foreground">Budgeted</p>
          </div>
          <div>
            <p className="text-base font-bold">{formatCurrency(totalActual)}</p>
            <p className="text-xs text-muted-foreground">Spent</p>
          </div>
          <div>
            <p
              className={`text-base font-bold ${totalDifference >= 0 ? "text-emerald-500" : "text-red-500"}`}
            >
              {formatCurrency(Math.abs(totalDifference))}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalDifference >= 0 ? "Under" : "Over"}
            </p>
          </div>
        </div>

        {/* Per-category bars */}
        <div className="space-y-3">
          {categories.map((cat) => {
            const budgetPct = (cat.planned / max) * 100;
            const spentPct = (cat.actual / max) * 100;
            const over = cat.actual > cat.planned;
            return (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm truncate">{cat.name}</span>
                  <span
                    className={`text-xs tabular-nums shrink-0 ${over ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    {formatCurrency(cat.actual)} / {formatCurrency(cat.planned)}
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                  {/* Budget bar (faint) */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/20"
                    style={{ width: `${budgetPct}%` }}
                  />
                  {/* Spent bar */}
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all ${over ? "bg-red-500" : "bg-primary"}`}
                    style={{ width: `${spentPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-full bg-primary" />
            Spent
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-full bg-muted-foreground/20" />
            Budget
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
