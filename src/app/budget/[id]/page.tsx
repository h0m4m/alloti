import { notFound } from "next/navigation";
import { getBudgetPeriod, getExpenses } from "@/lib/actions";
import { BudgetDetailView } from "@/components/budget-detail-view";

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const period = await getBudgetPeriod(id);

  if (!period) notFound();

  const expenses = await getExpenses(id);

  return (
    <BudgetDetailView period={period} expenses={expenses} />
  );
}
