import { notFound } from "next/navigation";
import { getBudgetPeriod, getExpenses, getIncomes } from "@/lib/actions";
import { BudgetDetailView } from "@/components/budget-detail-view";

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [period, expenses, incomes] = await Promise.all([
    getBudgetPeriod(id),
    getExpenses(id),
    getIncomes(id),
  ]);

  if (!period) notFound();

  return (
    <BudgetDetailView period={period} expenses={expenses} incomes={incomes} />
  );
}
