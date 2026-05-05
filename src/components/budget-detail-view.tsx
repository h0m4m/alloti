"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddExpenseForm } from "@/components/add-expense-form";
import {
  formatCurrency,
  formatDateShort,
  formatDate,
  daysRemaining,
  percentSpent,
} from "@/lib/format";
import { deleteBudgetPeriod, deleteExpense } from "@/lib/actions";
import type { BudgetPeriod, Expense } from "@/lib/types";

export function BudgetDetailView({
  period,
  expenses,
}: {
  period: BudgetPeriod;
  expenses: Expense[];
}) {
  const router = useRouter();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalSpent = period.categories.reduce((s, c) => s + c.spent, 0);
  const totalPct = percentSpent(totalSpent, period.totalBudget);
  const days = daysRemaining(period.endDate);
  const isActive = new Date(period.endDate) >= new Date();

  const categoryMap = new Map(period.categories.map((c) => [c._id, c]));

  async function handleDelete() {
    setDeleting(true);
    await deleteBudgetPeriod(period._id);
    router.push("/");
  }

  async function handleDeleteExpense(expense: Expense) {
    await deleteExpense(
      expense._id,
      expense.budgetPeriodId,
      expense.categoryId,
      expense.amount
    );
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">{period.name}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {formatDateShort(period.startDate)} –{" "}
            {formatDateShort(period.endDate)}
            {isActive && ` · ${days}d left`}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 hidden sm:flex"
          onClick={() => {
            setSelectedCategory(null);
            setShowAddExpense(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Expense
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-2">
          <div className="flex justify-between text-sm sm:text-base">
            <span
              className={
                totalPct > 100 ? "text-destructive font-medium" : ""
              }
            >
              {formatCurrency(totalSpent)} spent
            </span>
            <span className="text-muted-foreground">
              {formatCurrency(period.totalBudget)} budget
            </span>
          </div>
          <Progress
            value={Math.min(totalPct, 100)}
            className={`h-3 ${totalPct > 100 ? "[&>div]:bg-destructive" : ""}`}
          />
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            {formatCurrency(Math.max(0, period.totalBudget - totalSpent))}{" "}
            remaining
          </p>
        </CardContent>
      </Card>

      {/* Desktop: two-column layout | Mobile: stacked */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Categories — wider column */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Categories</h2>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 sm:hidden"
              onClick={() => {
                setSelectedCategory(null);
                setShowAddExpense(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Expense
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {period.categories.map((cat) => {
              const pct = percentSpent(cat.spent, cat.allocated);
              const isOver = pct > 100;
              const catExpenses = expenses.filter(
                (e) => e.categoryId === cat._id
              );

              return (
                <Card key={cat._id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 text-sm font-medium">
                        {cat.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setSelectedCategory(cat._id);
                          setShowAddExpense(true);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className={isOver ? "text-destructive" : ""}>
                        {formatCurrency(cat.spent)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(cat.allocated)}
                      </span>
                    </div>

                    <Progress
                      value={Math.min(pct, 100)}
                      className={`h-1.5 ${isOver ? "[&>div]:bg-destructive" : ""}`}
                    />

                    {catExpenses.length > 0 && (
                      <div className="pt-1 space-y-1">
                        {catExpenses.slice(0, 3).map((exp) => (
                          <div
                            key={exp._id}
                            className="flex items-center justify-between text-xs group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate text-muted-foreground">
                                {exp.description}
                              </span>
                              <span className="text-muted-foreground/60 shrink-0">
                                {formatDateShort(exp.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span>{formatCurrency(exp.amount)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteExpense(exp)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {catExpenses.length > 3 && (
                          <p className="text-[10px] text-muted-foreground">
                            +{catExpenses.length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Expenses — narrower column */}
        <div className="lg:col-span-2 space-y-3">
          {expenses.length > 0 && (
            <>
              <h2 className="text-sm font-medium">Recent Expenses</h2>
              <Card>
                <CardContent className="p-3 sm:p-4 space-y-2">
                  {expenses.slice(0, 15).map((exp, i) => {
                    const cat = categoryMap.get(exp.categoryId);
                    return (
                      <div key={exp._id}>
                        {i > 0 && <Separator className="my-2" />}
                        <div className="flex items-center justify-between group">
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-sm font-medium truncate">
                              {exp.description}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {cat && (
                                <span
                                  className="px-1.5 py-0.5 rounded-full text-[10px]"
                                  style={{
                                    backgroundColor: cat.color + "20",
                                    color: cat.color,
                                  }}
                                >
                                  {cat.name}
                                </span>
                              )}
                              <span>{formatDate(exp.date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-sm font-medium">
                              {formatCurrency(exp.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteExpense(exp)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Add Expense Drawer */}
      <AddExpenseForm
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        budgetPeriodId={period._id}
        categories={period.categories}
        defaultCategoryId={selectedCategory}
      />

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete budget?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{period.name}&quot; and all its
              expenses. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
