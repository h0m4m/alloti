import { getBudgetPeriods, searchExpenses } from "@/lib/actions";
import { ExpensesListView } from "@/components/expenses-list-view";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    budget?: string;
    category?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const params = await searchParams;
  const [periods, expenses] = await Promise.all([
    getBudgetPeriods(),
    searchExpenses({
      budgetPeriodId: params.budget,
      categoryId: params.category,
      query: params.q,
      sortBy: (params.sort as "date" | "amount" | "description") || "date",
      sortOrder: (params.order as "asc" | "desc") || "desc",
    }),
  ]);

  return (
    <ExpensesListView
      expenses={expenses}
      periods={periods}
      initialQuery={params.q || ""}
      initialBudgetId={params.budget || ""}
      initialCategoryId={params.category || ""}
      initialSort={params.sort || "date"}
      initialOrder={params.order || "desc"}
    />
  );
}
