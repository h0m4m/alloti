"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pause,
  Play,
  Trash2,
  Check,
  CalendarClock,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddRecurringForm } from "@/components/add-recurring-form";
import { formatDate } from "@/lib/format";
import { Currency } from "@/components/currency";
import {
  toggleRecurringExpenseStatus,
  markRecurringExpensePaid,
  deleteRecurringExpense,
} from "@/lib/actions";
import type { RecurringExpense, BudgetPeriod } from "@/lib/types";

interface Props {
  items: RecurringExpense[];
  periods: BudgetPeriod[];
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export function RecurringExpensesView({ items, periods }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payBudgetId, setPayBudgetId] = useState("");
  const [payCategoryId, setPayCategoryId] = useState("");

  const now = new Date();
  const active = items.filter((i) => i.status === "active");
  const paused = items.filter((i) => i.status === "paused");

  const overdue = active.filter((i) => new Date(i.nextDueDate) <= now);
  const upcoming = active.filter((i) => {
    const due = new Date(i.nextDueDate);
    return due > now;
  });

  const activePeriods = periods.filter((p) => new Date(p.endDate) >= now);
  const selectedPeriod = activePeriods.find((p) => p._id === payBudgetId);

  function startPay(item: RecurringExpense) {
    setPayingId(item._id);
    setPayBudgetId(activePeriods[0]?._id || "");
    setPayCategoryId("");
  }

  async function confirmPay() {
    if (!payingId) return;
    await markRecurringExpensePaid(
      payingId,
      payBudgetId || undefined,
      payCategoryId || undefined
    );
    setPayingId(null);
    router.refresh();
    toast.success("Marked as paid");
  }

  async function handleToggle(id: string) {
    await toggleRecurringExpenseStatus(id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteRecurringExpense(id);
    router.refresh();
    toast.success("Recurring expense deleted");
  }

  function renderItem(item: RecurringExpense) {
    const isDue = new Date(item.nextDueDate) <= now;
    return (
      <Card key={item._id}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">{item.name}</span>
            </div>
            <span className="text-sm font-medium shrink-0">
              <Currency amount={item.amount} />
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {FREQUENCY_LABELS[item.frequency]}
            </Badge>
            {item.categoryName && (
              <Badge variant="secondary" className="text-xs">
                {item.categoryName}
              </Badge>
            )}
            {isDue && item.status === "active" && (
              <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                Due {formatDate(item.nextDueDate)}
              </Badge>
            )}
            {!isDue && item.status === "active" && (
              <span className="text-xs text-muted-foreground">
                Next: {formatDate(item.nextDueDate)}
              </span>
            )}
            {item.status === "paused" && (
              <Badge variant="secondary" className="text-xs">
                Paused
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 pt-1">
            {item.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 h-7 text-xs"
                onClick={() => startPay(item)}
              >
                <Check className="h-3 w-3" />
                Mark Paid
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 h-7 text-xs"
              onClick={() => handleToggle(item._id)}
            >
              {item.status === "active" ? (
                <>
                  <Pause className="h-3 w-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Resume
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => handleDelete(item._id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="Recurring Expenses" />
        <Button
          size="sm"
          className="gap-1.5 hidden sm:flex"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-4 w-4" />
          Add Recurring
        </Button>
      </div>

      {/* Floating Action Button - mobile */}
      <button
        className="fixed bottom-20 right-4 z-40 sm:hidden flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        onClick={() => setShowAdd(true)}
      >
        <Plus className="h-5 w-5" />
      </button>

      {items.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-muted-foreground">No recurring expenses yet</p>
          <p className="text-sm text-muted-foreground">
            Track predictable payments like rent, subscriptions, and memberships
          </p>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" />
            Add your first recurring expense
          </Button>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-amber-600">
            Due / Overdue
          </h2>
          <div className="space-y-3">{overdue.map(renderItem)}</div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Upcoming
          </h2>
          <div className="space-y-3">{upcoming.map(renderItem)}</div>
        </section>
      )}

      {/* Paused */}
      {paused.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Paused
          </h2>
          <div className="space-y-3">{paused.map(renderItem)}</div>
        </section>
      )}

      {/* Add Recurring Form */}
      <AddRecurringForm
        open={showAdd}
        onClose={() => setShowAdd(false)}
      />

      {/* Mark as Paid Dialog */}
      <Dialog
        open={payingId !== null}
        onOpenChange={(o) => !o && setPayingId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Optionally log this as an expense in an active budget.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {activePeriods.length > 0 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget</label>
                  <Select
                    value={payBudgetId || "__none__"}
                    onValueChange={(v) => {
                      setPayBudgetId(v === "__none__" ? "" : (v ?? ""));
                      setPayCategoryId("");
                    }}
                    items={{
                      __none__: "No budget",
                      ...Object.fromEntries(
                        activePeriods.map((p) => [p._id, p.name])
                      ),
                    }}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        No budget (just advance)
                      </SelectItem>
                      {activePeriods.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPeriod && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={payCategoryId || "__pick__"}
                      onValueChange={(v) =>
                        setPayCategoryId(v === "__pick__" ? "" : (v ?? ""))
                      }
                      items={{
                        __pick__: "Pick a category",
                        ...Object.fromEntries(
                          selectedPeriod.categories.map((c) => [c._id, c.name])
                        ),
                      }}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Pick a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__pick__">
                          Pick a category
                        </SelectItem>
                        {selectedPeriod.categories.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active budgets. The due date will be advanced without logging
                an expense.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingId(null)}>
              Cancel
            </Button>
            <Button onClick={confirmPay}>Confirm Paid</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
