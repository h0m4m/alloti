import Link from "next/link";
import {
  Plus,
  TrendingUp,
  CalendarClock,
  AlertTriangle,
  Target,
  Briefcase,
} from "lucide-react";
import { getBudgetPeriods, getUpcomingRecurring, getSavingsGoals } from "@/lib/actions";
import { BudgetPeriodCard } from "@/components/budget-period-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/format";
import { Currency } from "@/components/currency";
import type { BudgetPeriod, RecurringExpense, SavingsGoal } from "@/lib/types";

export default async function Home() {
  const [periods, upcoming, goals] = await Promise.all([
    getBudgetPeriods(),
    getUpcomingRecurring(7),
    getSavingsGoals(),
  ]);

  const now = new Date();
  const activePeriods = (periods as BudgetPeriod[]).filter(
    (p) => new Date(p.endDate) >= now
  );
  const pastPeriods = (periods as BudgetPeriod[]).filter(
    (p) => new Date(p.endDate) < now
  );
  const upcomingItems = upcoming as RecurringExpense[];
  const activeGoals = (goals as SavingsGoal[]).filter(
    (g) => g.status === "in_progress" || g.status === "not_started"
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Mobile quick links — only for pages not in bottom nav */}
      <div className="flex gap-2 sm:hidden">
        <Link href="/income" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Income
          </Button>
        </Link>
        <Link href="/recurring" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <CalendarClock className="h-4 w-4" />
            Recurring
          </Button>
        </Link>
        <Link href="/goals" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Target className="h-4 w-4" />
            Goals
          </Button>
        </Link>
        <Link href="/investments" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Briefcase className="h-4 w-4" />
            Invest
          </Button>
        </Link>
      </div>

      {/* Upcoming Recurring Alerts */}
      {upcomingItems.length > 0 && (
        <Card className="border-amber-500/30">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-medium">Upcoming Payments</h3>
            </div>
            {upcomingItems.slice(0, 4).map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(item.nextDueDate)}
                  </span>
                </div>
                <span className="font-medium shrink-0">
                  <Currency amount={item.amount} />
                </span>
              </div>
            ))}
            {upcomingItems.length > 4 && (
              <Link href="/recurring">
                <p className="text-xs text-muted-foreground hover:underline">
                  +{upcomingItems.length - 4} more
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goals Preview */}
      {activeGoals.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Savings Goals</h3>
              </div>
              <Link href="/goals">
                <Button variant="ghost" size="sm" className="text-xs h-6">
                  View all
                </Button>
              </Link>
            </div>
            {activeGoals.slice(0, 3).map((goal) => {
              const pct =
                goal.targetAmount > 0
                  ? Math.round(
                      (goal.currentAmount / goal.targetAmount) * 100
                    )
                  : 0;
              return (
                <div key={goal._id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{goal.name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className={`h-1.5 ${pct >= 100 ? "[&>div]:bg-green-500" : ""}`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {periods.length === 0 && (
        <div className="text-center py-16 sm:py-24 space-y-3">
          <p className="text-muted-foreground">No budgets yet</p>
          <Link href="/budget/new">
            <Button variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create your first budget
            </Button>
          </Link>
        </div>
      )}

      {activePeriods.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activePeriods.map((period) => (
              <BudgetPeriodCard key={period._id} period={period} />
            ))}
          </div>
        </section>
      )}

      {pastPeriods.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Past
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pastPeriods.map((period) => (
              <BudgetPeriodCard key={period._id} period={period} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
