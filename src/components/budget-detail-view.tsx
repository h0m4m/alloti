"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  ArrowLeftRight,
  Copy,
  BookmarkPlus,
  ClipboardList,
  Paperclip,
  Pencil,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddExpenseForm } from "@/components/add-expense-form";
import { EditExpenseForm } from "@/components/edit-expense-form";
import { TransferMoneyForm } from "@/components/transfer-money-form";
import { SaveTemplateDialog } from "@/components/save-template-dialog";
import { ReceiptPreview } from "@/components/receipt-preview";
import {
  formatCurrency,
  formatDateShort,
  formatDate,
  daysRemaining,
  percentSpent,
} from "@/lib/format";
import { Currency } from "@/components/currency";
import { deleteBudgetPeriod, deleteExpense } from "@/lib/actions";
import type { BudgetPeriod, Expense, Income } from "@/lib/types";

export function BudgetDetailView({
  period,
  expenses,
  incomes = [],
}: {
  period: BudgetPeriod;
  expenses: Expense[];
  incomes?: Income[];
}) {
  const router = useRouter();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [receiptExpense, setReceiptExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const totalSpent = period.categories.reduce((s, c) => s + c.spent, 0);
  const totalPct = percentSpent(totalSpent, period.totalBudget);
  const days = daysRemaining(period.endDate);
  const isActive = new Date(period.endDate) >= new Date();
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

  const categoryMap = new Map(period.categories.map((c) => [c._id, c]));

  async function handleDelete() {
    setDeleting(true);
    await deleteBudgetPeriod(period._id);
    toast.success("Budget deleted", { description: period.name });
    router.push("/");
  }

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
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title={period.name}>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{period.name}</h1>
            <p className="text-xs text-muted-foreground">
              {formatDateShort(period.startDate)} –{" "}
              {formatDateShort(period.endDate)}
              {isActive && ` · ${days}d left`}
            </p>
          </div>
        </PageHeader>
        <div className="flex items-center gap-1 ml-auto shrink-0">
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
              <Currency amount={totalSpent} /> spent
            </span>
            <span className="text-muted-foreground">
              <Currency amount={period.totalBudget} /> budget
            </span>
          </div>
          <Progress
            value={Math.min(totalPct, 100)}
            className={`h-3 ${totalPct > 100 ? "[&>div]:bg-destructive" : ""}`}
          />
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            <Currency amount={Math.max(0, period.totalBudget - totalSpent)} />{" "}
            remaining
          </p>
        </CardContent>
      </Card>

      {/* Income Summary */}
      {incomes.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Income this period
              </p>
              <p className="text-sm font-medium text-green-600">
                +<Currency amount={totalIncome} />
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Surplus / Deficit
              </p>
              <p
                className={`text-sm font-medium ${totalIncome - totalSpent >= 0 ? "text-green-600" : "text-destructive"}`}
              >
                <Currency amount={totalIncome - totalSpent} />
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {/* Floating Action Button - mobile */}
      <button
        className="fixed bottom-20 right-4 z-40 sm:hidden flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        onClick={() => {
          setSelectedCategory(null);
          setShowAddExpense(true);
        }}
      >
        <Plus className="h-5 w-5" />
      </button>

      <div className="flex flex-wrap gap-2">
        <Link href={`/budget/${period._id}/edit`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
        {period.categories.length >= 2 && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowTransfer(true)}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Move Money
          </Button>
        )}
        <Link href={`/budget/new?mode=duplicate&source=${period._id}`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>
        </Link>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setShowSaveTemplate(true)}
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          Save Template
        </Button>
        <Link href={`/budget/${period._id}/review`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Review
          </Button>
        </Link>
      </div>

      {/* Desktop: two-column layout | Mobile: stacked */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Categories — wider column */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-sm font-medium">Categories</h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {period.categories.map((cat) => {
              const pct = percentSpent(cat.spent, cat.allocated);
              const isOver = pct > 100;
              const catExpenses = expenses.filter(
                (e) => e.categoryId === cat._id
              );

              return (
                <Card key={cat._id} className="group/card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/budget/${period._id}/category/${cat._id}`}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="flex-1 text-sm font-medium truncate">
                          {cat.name}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0" />
                      </Link>
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

                    <Link
                      href={`/budget/${period._id}/category/${cat._id}`}
                      className="block space-y-2"
                    >
                      <div className="flex justify-between text-xs">
                        <span className={isOver ? "text-destructive" : ""}>
                          <Currency amount={cat.spent} /> spent
                        </span>
                        <span className="text-muted-foreground">
                          of <Currency amount={cat.allocated} />
                        </span>
                      </div>

                      <p
                        className={`text-xs font-medium ${isOver ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {isOver
                          ? <><Currency amount={cat.spent - cat.allocated} /> over budget</>
                          : <><Currency amount={cat.allocated - cat.spent} /> remaining</>}
                      </p>

                      <Progress
                        value={Math.min(pct, 100)}
                        className={`h-1.5 ${isOver ? "[&>div]:bg-destructive" : ""}`}
                      />
                    </Link>

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
                              {exp.hasAttachment && (
                                <button
                                  onClick={() => setReceiptExpense(exp)}
                                  className="shrink-0"
                                >
                                  <Paperclip className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                </button>
                              )}
                              <span className="text-muted-foreground/60 shrink-0">
                                {formatDateShort(exp.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span><Currency amount={exp.amount} /></span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setEditingExpense(exp)}
                              >
                                <Pencil className="h-2.5 w-2.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteExpense(exp)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {catExpenses.length > 3 && (
                          <Link
                            href={`/budget/${period._id}/category/${cat._id}`}
                            className="block text-[10px] text-muted-foreground hover:text-primary transition-colors"
                          >
                            +{catExpenses.length - 3} more
                          </Link>
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
                    const cat = exp.categoryId ? categoryMap.get(exp.categoryId) : undefined;
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
                            {/* Mobile: dropdown menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:hidden">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingExpense(exp)}>
                                  <Pencil className="h-3.5 w-3.5 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteExpense(exp)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {/* Desktop: hover buttons */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setEditingExpense(exp)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* Transfer Money */}
      <TransferMoneyForm
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        budgetPeriodId={period._id}
        categories={period.categories}
      />

      {/* Save as Template */}
      <SaveTemplateDialog
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        budgetPeriodId={period._id}
        budgetName={period.name}
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
