"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Currency } from "@/components/currency";

interface CategoryData {
  name: string;
  color: string;
  spent: number;
  allocated: number;
  percentage: number;
}

interface Props {
  periodName: string;
  totalSpent: number;
  totalBudget: number;
  categories: CategoryData[];
}

export function SpendingPieChart({
  periodName,
  totalSpent,
  totalBudget,
  categories,
}: Props) {
  const sorted = [...categories].sort((a, b) => b.spent - a.spent);
  const pctUsed =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  // Build conic-gradient segments for donut
  let cumulative = 0;
  const segments = sorted
    .filter((c) => c.spent > 0)
    .map((cat) => {
      const start = cumulative;
      cumulative += cat.percentage;
      return `${cat.color} ${start}% ${cumulative}%`;
    });
  if (cumulative < 100) {
    segments.push(`hsl(var(--muted)) ${cumulative}% 100%`);
  }
  const gradient = `conic-gradient(${segments.join(", ")})`;

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Spending by Category</h3>
          <span className="text-xs text-muted-foreground">{periodName}</span>
        </div>

        {/* Donut + center label */}
        <div className="flex justify-center">
          <div className="relative h-36 w-36">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: gradient }}
            />
            <div className="absolute inset-[20%] rounded-full bg-card flex flex-col items-center justify-center">
              <span className="text-lg font-bold leading-tight">
                {Math.round(pctUsed)}%
              </span>
              <span className="text-[10px] text-muted-foreground">used</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-center gap-6 text-center">
          <div>
            <p className="text-base font-bold"><Currency amount={totalSpent} /></p>
            <p className="text-xs text-muted-foreground">Spent</p>
          </div>
          <div>
            <p className="text-base font-bold"><Currency amount={totalBudget} /></p>
            <p className="text-xs text-muted-foreground">Budget</p>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {sorted.slice(0, 6).map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-sm">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 truncate">{cat.name}</span>
              <span className="text-muted-foreground tabular-nums text-xs">
                <Currency amount={cat.spent} />
              </span>
              <span className="text-muted-foreground tabular-nums text-xs w-8 text-right">
                {cat.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
