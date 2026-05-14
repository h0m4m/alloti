"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Copy,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Target,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Currency } from "@/components/currency";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  percentSpent,
} from "@/lib/format";
import {
  rolloverToBudget,
  rolloverToGoal,
  ignoreRollover,
} from "@/lib/actions";
import type {
  BudgetPeriod,
  Expense,
  CategoryTransfer,
  SavingsGoal,
  BudgetRolloverRecord,
} from "@/lib/types";

interface ReviewData {
  period: BudgetPeriod;
  expenses: Expense[];
  transfers: CategoryTransfer[];
  totalSpent: number;
  totalAllocated: number;
  remaining: number;
  unallocated: number;
  topMerchants: { name: string; total: number; count: number }[];
  overspentCategories: {
    _id: string;
    name: string;
    allocated: number;
    spent: number;
    over: number;
    color: string;
  }[];
  expenseCount: number;
  totalIncome: number;
  incomeCount: number;
}

interface Props {
  review: ReviewData;
  allPeriods?: BudgetPeriod[];
  goals?: SavingsGoal[];
  rolloverInfo?: {
    remaining: number;
    hasRolledOver: boolean;
    rolloverRecord?: BudgetRolloverRecord | null;
  };
}

export function BudgetReviewView({
  review,
  allPeriods = [],
  goals = [],
  rolloverInfo,
}: Props) {
  const router = useRouter();
  const { period } = review;
  const totalPct = percentSpent(review.totalSpent, period.totalBudget);

  const isPast = new Date(period.endDate) < new Date();
  const hasRemaining = rolloverInfo && rolloverInfo.remaining > 0;
  const hasRolledOver = rolloverInfo?.hasRolledOver;

  // Other budget periods the user could roll into (active or future)
  const otherPeriods = allPeriods.filter(
    (p) => p._id !== period._id && new Date(p.endDate) >= new Date()
  );
  const activeGoals = goals.filter(
    (g) => g.status === "in_progress" || g.status === "not_started"
  );

  const [rolloverAction, setRolloverAction] = useState<
    "budget" | "goal" | "ignore" | null
  >(null);
  const [targetBudgetId, setTargetBudgetId] = useState(
    otherPeriods[0]?._id || ""
  );
  const [targetGoalId, setTargetGoalId] = useState(activeGoals[0]?._id || "");
  const [processing, setProcessing] = useState(false);

  async function handleRollover() {
    if (!rolloverInfo) return;
    setProcessing(true);

    if (rolloverAction === "budget" && targetBudgetId) {
      await rolloverToBudget(
        period._id,
        targetBudgetId,
        rolloverInfo.remaining
      );
      toast.success("Rolled over to budget", {
        description: `${formatCurrency(rolloverInfo.remaining)} added`,
      });
    } else if (rolloverAction === "goal" && targetGoalId) {
      await rolloverToGoal(period._id, targetGoalId, rolloverInfo.remaining);
      toast.success("Rolled over to savings goal", {
        description: `${formatCurrency(rolloverInfo.remaining)} contributed`,
      });
    } else if (rolloverAction === "ignore") {
      await ignoreRollover(period._id, rolloverInfo.remaining);
      toast.success("Rollover skipped");
    }

    setProcessing(false);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader
          crumbs={[{ label: "Home", href: "/" }, { label: period.name, href: `/budget/${period._id}` }]}
          title="Review"
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">Budget Review</h1>
            <p className="text-xs text-muted-foreground">
              {period.name} &middot; {formatDateShort(period.startDate)} –{" "}
              {formatDateShort(period.endDate)}
            </p>
          </div>
        </PageHeader>
        <Link
          href={`/budget/new?mode=duplicate&source=${period._id}`}
        >
          <Button size="sm" variant="outline" className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Create Next</span>
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-lg font-bold">
              <Currency amount={period.totalBudget} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p
              className={`text-lg font-bold ${totalPct > 100 ? "text-destructive" : ""}`}
            >
              <Currency amount={review.totalSpent} />
            </p>
          </CardContent>
        </Card>
        {review.totalIncome > 0 && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-lg font-bold text-green-600">
                <Currency amount={review.totalIncome} />
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p
              className={`text-lg font-bold ${review.remaining < 0 ? "text-destructive" : "text-green-600"}`}
            >
              <Currency amount={review.remaining} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-lg font-bold">{review.expenseCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{Math.round(totalPct)}% of budget used</span>
            <span className="text-muted-foreground">
              <Currency amount={review.totalSpent} /> /{" "}
              <Currency amount={period.totalBudget} />
            </span>
          </div>
          <Progress
            value={Math.min(totalPct, 100)}
            className={`h-3 ${totalPct > 100 ? "[&>div]:bg-destructive" : ""}`}
          />
        </CardContent>
      </Card>

      {/* Rollover Section */}
      {isPast && hasRemaining && !hasRolledOver && (
        <Card className="border-green-500/30">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-medium">
                <Currency amount={rolloverInfo!.remaining} /> remaining
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              This budget ended with money left over. What would you like to do
              with it?
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              {otherPeriods.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRolloverAction("budget")}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    rolloverAction === "budget"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Roll to budget</p>
                    <p className="text-[10px] text-muted-foreground">
                      Add to another budget
                    </p>
                  </div>
                </button>
              )}
              {activeGoals.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRolloverAction("goal")}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    rolloverAction === "goal"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Target className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Send to goal</p>
                    <p className="text-[10px] text-muted-foreground">
                      Contribute to savings
                    </p>
                  </div>
                </button>
              )}
              <button
                type="button"
                onClick={() => setRolloverAction("ignore")}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                  rolloverAction === "ignore"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <Ban className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Ignore</p>
                  <p className="text-[10px] text-muted-foreground">
                    Skip rollover
                  </p>
                </div>
              </button>
            </div>

            {rolloverAction === "budget" && otherPeriods.length > 0 && (
              <Select
                value={targetBudgetId}
                onValueChange={(v) => v && setTargetBudgetId(v)}
                items={Object.fromEntries(
                  otherPeriods.map((p) => [p._id, p.name])
                )}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  {otherPeriods.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {rolloverAction === "goal" && activeGoals.length > 0 && (
              <Select
                value={targetGoalId}
                onValueChange={(v) => v && setTargetGoalId(v)}
                items={Object.fromEntries(
                  activeGoals.map((g) => [g._id, g.name])
                )}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {activeGoals.map((g) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.name} — <Currency amount={g.currentAmount} /> / <Currency amount={g.targetAmount} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {rolloverAction && (
              <Button
                className="w-full"
                disabled={
                  processing ||
                  (rolloverAction === "budget" && !targetBudgetId) ||
                  (rolloverAction === "goal" && !targetGoalId)
                }
                onClick={handleRollover}
              >
                {processing
                  ? "Processing..."
                  : rolloverAction === "ignore"
                    ? "Skip Rollover"
                    : `Roll Over ${formatCurrency(rolloverInfo!.remaining)}`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rollover Already Done */}
      {hasRolledOver && rolloverInfo?.rolloverRecord && (
        <Card className="border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <div className="text-sm">
              <span className="font-medium">
                <Currency amount={rolloverInfo.rolloverRecord.amount} />
              </span>{" "}
              <span className="text-muted-foreground">
                {rolloverInfo.rolloverRecord.action === "rollover_to_budget"
                  ? "rolled over to another budget"
                  : rolloverInfo.rolloverRecord.action === "rollover_to_goal"
                    ? "sent to savings goal"
                    : "rollover skipped"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Performance */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Category Performance</h2>
        <div className="space-y-2">
          {period.categories.map((cat) => {
            const pct = percentSpent(cat.spent, cat.allocated);
            const isOver = cat.spent > cat.allocated;
            const diff = cat.allocated - cat.spent;

            return (
              <Card key={cat._id}>
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      {isOver ? (
                        <span className="text-destructive flex items-center gap-0.5">
                          <TrendingDown className="h-3 w-3" />
                          <Currency amount={Math.abs(diff)} /> over
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" />
                          <Currency amount={diff} /> left
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span><Currency amount={cat.spent} /> spent</span>
                    <span><Currency amount={cat.allocated} /> allocated</span>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className={`h-1.5 ${isOver ? "[&>div]:bg-destructive" : ""}`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Overspent Warning */}
      {review.overspentCategories.length > 0 && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-medium">Over Budget</h3>
            </div>
            <div className="space-y-1">
              {review.overspentCategories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex justify-between text-sm"
                >
                  <span>{cat.name}</span>
                  <span className="text-destructive">
                    <Currency amount={cat.over} /> over
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Merchants */}
      {review.topMerchants.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Top Spending</h2>
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-2">
              {review.topMerchants.slice(0, 8).map((m, i) => (
                <div key={m.name}>
                  {i > 0 && <Separator className="my-2" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.count} expense{m.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      <Currency amount={m.total} />
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer History */}
      {review.transfers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Budget Transfers</h2>
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-2">
              {review.transfers.map((t, i) => {
                const fromCat = period.categories.find(
                  (c) => c._id === t.fromCategoryId
                );
                const toCat = period.categories.find(
                  (c) => c._id === t.toCategoryId
                );
                return (
                  <div key={t._id}>
                    {i > 0 && <Separator className="my-2" />}
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {fromCat?.name || "Unknown"} → {toCat?.name || "Unknown"}
                      </span>
                      <span className="font-medium">
                        <Currency amount={t.amount} />
                      </span>
                    </div>
                    {t.note && (
                      <p className="text-xs text-muted-foreground">{t.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(t.createdAt)}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/budget/new?mode=duplicate&source=${period._id}`}
          className="flex-1"
        >
          <Button variant="outline" className="w-full gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            Create Next Budget
          </Button>
        </Link>
      </div>
    </div>
  );
}
