"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AddIncomeForm } from "@/components/add-income-form";
import { Currency } from "@/components/currency";
import { formatDate } from "@/lib/format";
import { deleteIncome } from "@/lib/actions";
import type { Income, BudgetPeriod } from "@/lib/types";

interface Props {
  incomes: Income[];
  periods: BudgetPeriod[];
}

export function IncomeListView({ incomes, periods }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  const periodMap = new Map(periods.map((p) => [p._id, p]));
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  async function handleDelete(id: string) {
    await deleteIncome(id);
    router.refresh();
    toast.success("Income deleted");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="Income" />
        <Button
          size="sm"
          className="gap-1.5 hidden sm:flex"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-4 w-4" />
          Add Income
        </Button>
      </div>

      {/* Floating Action Button - mobile */}
      <button
        className="fixed bottom-20 right-4 z-40 sm:hidden flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        onClick={() => setShowAdd(true)}
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Summary */}
      {incomes.length > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">
                Total income
              </span>
            </div>
            <span className="text-lg font-bold text-green-600">
              <Currency amount={totalIncome} />
            </span>
          </CardContent>
        </Card>
      )}

      {incomes.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-muted-foreground">No income recorded yet</p>
          <p className="text-sm text-muted-foreground">
            Track your salary, freelance work, and other money coming in
          </p>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" />
            Record your first income
          </Button>
        </div>
      )}

      {/* Income List */}
      {incomes.length > 0 && (
        <Card>
          <CardContent className="p-3 sm:p-4 space-y-2">
            {incomes.map((inc, i) => {
              const period = inc.budgetPeriodId
                ? periodMap.get(inc.budgetPeriodId)
                : null;
              return (
                <div key={inc._id}>
                  {i > 0 && <Separator className="my-2" />}
                  <div className="flex items-center justify-between group">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium truncate">
                        {inc.source}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                        <span>{formatDate(inc.date)}</span>
                        {period && (
                          <span className="text-muted-foreground/60">
                            {period.name}
                          </span>
                        )}
                        {inc.note && (
                          <span className="text-muted-foreground/60 truncate max-w-[150px]">
                            {inc.note}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-medium text-green-600">
                        +<Currency amount={inc.amount} />
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(inc._id)}
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

      {/* Add Income Form */}
      <AddIncomeForm
        open={showAdd}
        onClose={() => setShowAdd(false)}
        periods={periods}
      />
    </div>
  );
}
