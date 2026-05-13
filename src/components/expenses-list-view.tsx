"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  ArrowUpDown,
  X,
  Trash2,
  Paperclip,
  Pencil,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  formatDate,
} from "@/lib/format";
import { deleteExpense } from "@/lib/actions";
import { StandaloneAddExpenseForm } from "@/components/add-expense-form";
import { EditExpenseForm } from "@/components/edit-expense-form";
import type { BudgetPeriod, Expense } from "@/lib/types";

interface Props {
  expenses: Expense[];
  periods: BudgetPeriod[];
  initialQuery: string;
  initialBudgetId: string;
  initialCategoryId: string;
  initialSort: string;
  initialOrder: string;
}

export function ExpensesListView({
  expenses,
  periods,
  initialQuery,
  initialBudgetId,
  initialCategoryId,
  initialSort,
  initialOrder,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [budgetId, setBudgetId] = useState(initialBudgetId);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [sort, setSort] = useState(initialSort);
  const [order, setOrder] = useState(initialOrder);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Build category list from selected budget or all budgets
  const selectedBudget = periods.find((p) => p._id === budgetId);
  const allCategories = selectedBudget
    ? selectedBudget.categories
    : Array.from(
        new Map(
          periods
            .flatMap((p) => p.categories)
            .map((c) => [c.name, c])
        ).values()
      );

  // Map category IDs to names/colors across all budgets
  const categoryMap = new Map(
    periods.flatMap((p) => p.categories).map((c) => [c._id, c])
  );

  // Map budget period IDs to names
  const periodMap = new Map(periods.map((p) => [p._id, p]));

  function buildUrl(overrides: Record<string, string>) {
    const state = {
      q: query,
      budget: budgetId,
      category: categoryId,
      sort,
      order,
      ...overrides,
    };
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.budget) params.set("budget", state.budget);
    if (state.category) params.set("category", state.category);
    if (state.sort !== "date") params.set("sort", state.sort);
    if (state.order !== "desc") params.set("order", state.order);
    return `/expenses?${params.toString()}`;
  }

  function applyFilters() {
    router.push(buildUrl({}));
  }

  function clearFilters() {
    setQuery("");
    setBudgetId("");
    setCategoryId("");
    setSort("date");
    setOrder("desc");
    router.push("/expenses");
  }

  function toggleSort(field: string) {
    if (sort === field) {
      const newOrder = order === "desc" ? "asc" : "desc";
      setOrder(newOrder);
      setSort(field);
      router.push(buildUrl({ sort: field, order: newOrder }));
    } else {
      setSort(field);
      setOrder("desc");
      router.push(buildUrl({ sort: field, order: "desc" }));
    }
  }

  function handleBudgetChange(value: string | null) {
    const newBudgetId = !value || value === "__all__" ? "" : value;
    setBudgetId(newBudgetId);
    setCategoryId("");
    router.push(buildUrl({ budget: newBudgetId, category: "" }));
  }

  function handleCategoryChange(value: string | null) {
    const newCategoryId = !value || value === "__all__" ? "" : value;
    setCategoryId(newCategoryId);
    router.push(buildUrl({ category: newCategoryId }));
  }

  async function handleDeleteExpense(expense: Expense) {
    await deleteExpense(
      expense._id,
      expense.budgetPeriodId!,
      expense.categoryId!,
      expense.amount
    );
    router.refresh();
    toast.success("Expense deleted");
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const searchWithDebounce = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        router.push(buildUrl({ q: newQuery }));
      }, 350);
    },
    [router, budgetId, categoryId, sort, order] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const hasFilters = query || budgetId || categoryId || sort !== "date";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="All Expenses" />
        <div className="ml-auto hidden sm:block">
          <Button size="sm" className="gap-1.5" onClick={() => setShowAddExpense(true)}>
            <Plus className="h-4 w-4" />
            Log Expense
          </Button>
        </div>
      </div>

      {/* Floating Action Button - mobile */}
      <button
        className="fixed bottom-20 right-4 z-40 sm:hidden flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        onClick={() => setShowAddExpense(true)}
      >
        <Plus className="h-5 w-5" />
      </button>

      <StandaloneAddExpenseForm
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        periods={periods}
      />

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-9"
            value={query}
            onChange={(e) => searchWithDebounce(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={budgetId || "__all__"}
            onValueChange={handleBudgetChange}
            items={{
              __all__: "All budgets",
              ...Object.fromEntries(periods.map((p) => [p._id, p.name])),
            }}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="All budgets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All budgets</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {allCategories.length > 0 && (
            <Select
              value={categoryId || "__all__"}
              onValueChange={handleCategoryChange}
              items={{
                __all__: "All categories",
                ...Object.fromEntries(
                  allCategories.map((c) => [c._id, c.name])
                ),
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {allCategories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant={sort === "date" ? "secondary" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => toggleSort("date")}
          >
            <ArrowUpDown className="h-3 w-3" />
            Date
          </Button>
          <Button
            variant={sort === "amount" ? "secondary" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => toggleSort("amount")}
          >
            <ArrowUpDown className="h-3 w-3" />
            Amount
          </Button>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={clearFilters}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {hasFilters ? "No expenses match your filters" : "No expenses yet"}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-3 sm:p-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            </p>
            {expenses.map((exp, i) => {
              const cat = exp.categoryId ? categoryMap.get(exp.categoryId) : undefined;
              const period = exp.budgetPeriodId ? periodMap.get(exp.budgetPeriodId) : undefined;
              return (
                <div key={exp._id}>
                  {i > 0 && <Separator className="my-2" />}
                  <div className="flex items-center justify-between group">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium truncate">
                        {exp.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
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
                        {period && (
                          <span className="text-muted-foreground/60">
                            {period.name}
                          </span>
                        )}
                        <span>{formatDate(exp.date)}</span>
                        {exp.hasAttachment && (
                          <Paperclip className="h-3 w-3" />
                        )}
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
                        onClick={() => setEditingExpense(exp)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
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
      )}

      {editingExpense && (
        <EditExpenseForm
          open={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          expense={editingExpense}
          categories={
            (editingExpense.budgetPeriodId ? periodMap.get(editingExpense.budgetPeriodId)?.categories : undefined) || []
          }
        />
      )}
    </div>
  );
}
