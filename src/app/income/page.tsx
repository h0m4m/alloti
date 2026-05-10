import { getIncomes, getBudgetPeriods } from "@/lib/actions";
import { IncomeListView } from "@/components/income-list-view";

export default async function IncomePage() {
  const [incomes, periods] = await Promise.all([
    getIncomes(),
    getBudgetPeriods(),
  ]);

  return <IncomeListView incomes={incomes} periods={periods} />;
}
