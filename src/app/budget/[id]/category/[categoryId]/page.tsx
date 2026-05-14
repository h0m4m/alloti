import { notFound } from "next/navigation";
import { getBudgetPeriod, getExpenses } from "@/lib/actions";
import { CategoryDetailView } from "@/components/category-detail-view";
import type { BudgetCategory } from "@/lib/types";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string; categoryId: string }>;
}) {
  const { id, categoryId } = await params;
  const [period, expenses] = await Promise.all([
    getBudgetPeriod(id),
    getExpenses(id, categoryId),
  ]);

  if (!period) notFound();

  const category = period.categories.find((c: BudgetCategory) => c._id === categoryId);
  if (!category) notFound();

  return (
    <CategoryDetailView
      period={period}
      category={category}
      expenses={expenses}
    />
  );
}
