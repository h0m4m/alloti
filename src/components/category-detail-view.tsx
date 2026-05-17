"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Paperclip, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AddExpenseForm } from "@/components/add-expense-form";
import { Currency } from "@/components/currency";
import { EditExpenseForm } from "@/components/edit-expense-form";
import { ReceiptPreview } from "@/components/receipt-preview";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  percentSpent,
} from "@/lib/format";
import { deleteExpense } from "@/lib/actions";
import type { BudgetPeriod, BudgetCategory, Expense } from "@/lib/types";

export function CategoryDetailView({
  period,
  category,
  expenses,
}: {
  period: BudgetPeriod;
  category: BudgetCategory;
  expenses: Expense[];
}) {
  const router = useRouter();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [receiptExpense, setReceiptExpense] = useState<Expense | null>(null);

  const pct = percentSpent(category.spent, category.allocated);
  const isOver = pct > 100;
  const remaining = category.allocated - category.spent;

  async function handleDeleteExpense(expense: Expense) {
    await deleteExpense(
      expense._id,
      expense.budgetPeriodId!,
      expense.categoryId!,
      expense.amount
    );
    router.refresh();
    toast.success("Expense deleted", {
      description: `${formatCurrency(expense.amount)} — ${expense.description}`,
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader
          crumbs={[
            { label: "Home", href: "/" },
            { label: period.name, href: `/budget/${period._id}` },
          ]}
          title={category.name}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <h1 className="text-xl font-bold truncate">{category.name}</h1>
          </div>
        </PageHeader>
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 hidden sm:flex"
            onClick={() => setShowAddExpense(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Category Progress */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm font-medium">{category.name}</span>
          </div>

          <div className="flex justify-between text-sm sm:text-base">
            <span className={isOver ? "text-destructive font-medium" : ""}>
              <Currency amount={category.spent} /> spent
            </span>
            <span className="text-muted-foreground">
              <Currency amount={category.allocated} /> budget
            </span>
          </div>

          <Progress
            value={Math.min(pct, 100)}
            className={`h-3 ${isOver ? "[&>div]:bg-destructive" : ""}`}
          />

          <p
            className={`text-sm text-center font-medium ${isOver ? "text-destructive" : "text-muted-foreground"}`}
          >
            {isOver ? (
              <><Currency amount={Math.abs(remaining)} /> over budget</>
            ) : (
              <><Currency amount={remaining} /> remaining</>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Floating Action Button - mobile */}
      <button
        className="fixed bottom-20 right-4 z-40 sm:hidden flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        onClick={() => setShowAddExpense(true)}
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Expenses List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">
            Expenses ({expenses.length})
          </h2>
        </div>

        {expenses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No expenses in this category yet.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5"
                onClick={() => setShowAddExpense(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add first expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-2">
              {expenses.map((exp, i) => (
                <div key={exp._id}>
                  {i > 0 && <Separator className="my-2" />}
                  <div className="flex items-center justify-between group">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium truncate">
                        {exp.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{formatDate(exp.date)}</span>
                        {exp.merchant && (
                          <span className="truncate">· {exp.merchant}</span>
                        )}
                        {exp.hasAttachment && (
                          <button
                            onClick={() => setReceiptExpense(exp)}
                          >
                            <Paperclip className="h-3 w-3 hover:text-primary" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-medium">
                        <Currency amount={exp.amount} />
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditingExpense(exp)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteExpense(exp)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Expense Drawer/Dialog */}
      <AddExpenseForm
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        budgetPeriodId={period._id}
        categories={period.categories}
        defaultCategoryId={category._id}
      />

      {/* Edit Expense */}
      {editingExpense && (
        <EditExpenseForm
          open={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          expense={editingExpense}
          categories={period.categories}
        />
      )}

      {/* Receipt Preview */}
      {receiptExpense && (
        <ReceiptPreview
          expenseId={receiptExpense._id}
          expenseDescription={receiptExpense.description}
          open={!!receiptExpense}
          onClose={() => setReceiptExpense(null)}
          onDeleted={() => router.refresh()}
        />
      )}
    </div>
  );
}
