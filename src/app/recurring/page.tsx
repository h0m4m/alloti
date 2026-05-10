import { getRecurringExpenses, getBudgetPeriods } from "@/lib/actions";
import { RecurringExpensesView } from "@/components/recurring-expenses-view";

export default async function RecurringPage() {
  const [recurring, periods] = await Promise.all([
    getRecurringExpenses(),
    getBudgetPeriods(),
  ]);

  return <RecurringExpensesView items={recurring} periods={periods} />;
}
