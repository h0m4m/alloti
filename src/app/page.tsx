import Link from "next/link";
import { Plus } from "lucide-react";
import { getBudgetPeriods } from "@/lib/actions";
import { BudgetPeriodCard } from "@/components/budget-period-card";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import type { BudgetPeriod } from "@/lib/types";

export default async function Home() {
  const session = await auth();
  const periods: BudgetPeriod[] = await getBudgetPeriods();

  const now = new Date();
  const activePeriods = periods.filter((p) => new Date(p.endDate) >= now);
  const pastPeriods = periods.filter((p) => new Date(p.endDate) < now);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Alloti
          </h1>
          <p className="text-sm text-muted-foreground">Your budgets</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/budget/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Budget</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
          <UserMenu
            name={session?.user?.name}
            email={session?.user?.email}
            image={session?.user?.image}
          />
        </div>
      </div>

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
