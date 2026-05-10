import {
  getBudgetPeriods,
  getMonthlyComparisonReport,
  getTopMerchantsReport,
  getAllCategoryNames,
} from "@/lib/actions";
import { ReportsView } from "@/components/reports-view";

export default async function ReportsPage() {
  const [periods, monthlyComparison, topMerchants, allCategories] =
    await Promise.all([
      getBudgetPeriods(),
      getMonthlyComparisonReport(),
      getTopMerchantsReport(),
      getAllCategoryNames(),
    ]);

  return (
    <ReportsView
      periods={periods}
      monthlyComparison={monthlyComparison}
      topMerchants={topMerchants}
      allCategories={allCategories}
    />
  );
}
