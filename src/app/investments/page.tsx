import {
  getInvestmentDashboard,
  getPortfolioChartData,
} from "@/lib/investment-actions";
import { InvestmentDashboardView } from "@/components/investment-dashboard-view";

export default async function InvestmentsPage() {
  const [dashboard, chartData] = await Promise.all([
    getInvestmentDashboard(),
    getPortfolioChartData(),
  ]);
  return <InvestmentDashboardView dashboard={dashboard} chartData={chartData} />;
}
