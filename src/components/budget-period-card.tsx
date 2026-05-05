import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatCurrency,
  formatDateShort,
  daysRemaining,
  percentSpent,
} from "@/lib/format";
import type { BudgetPeriod } from "@/lib/types";

export function BudgetPeriodCard({ period }: { period: BudgetPeriod }) {
  const totalSpent = period.categories.reduce((sum, c) => sum + c.spent, 0);
  const pct = percentSpent(totalSpent, period.totalBudget);
  const days = daysRemaining(period.endDate);
  const isOver = pct > 100;
  const isActive = new Date(period.endDate) >= new Date();

  return (
    <Link href={`/budget/${period._id}`}>
      <Card className="transition-colors hover:bg-accent/50 active:bg-accent">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{period.name}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDateShort(period.startDate)} –{" "}
                {formatDateShort(period.endDate)}
              </p>
            </div>
            {isActive && (
              <span className="text-xs text-muted-foreground">
                {days}d left
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className={isOver ? "text-destructive font-medium" : ""}>
                {formatCurrency(totalSpent)}
              </span>
              <span className="text-muted-foreground">
                {formatCurrency(period.totalBudget)}
              </span>
            </div>
            <Progress
              value={Math.min(pct, 100)}
              className={`h-2 ${isOver ? "[&>div]:bg-destructive" : ""}`}
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {period.categories.slice(0, 4).map((cat) => (
              <span
                key={cat._id}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: cat.color + "20",
                  color: cat.color,
                }}
              >
                {cat.name}
              </span>
            ))}
            {period.categories.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{period.categories.length - 4}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
