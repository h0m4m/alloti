import {
  getInvestmentDashboard,
  getPortfolioChartData,
  getWatchlist,
} from "@/lib/investment-actions";
import { InvestmentDashboardView } from "@/components/investment-dashboard-view";

export default async function InvestmentsPage() {
  const [dashboard, chartData, watchlist] = await Promise.all([
    getInvestmentDashboard(),
    getPortfolioChartData(),
    getWatchlist(),
  ]);
  return (
    <InvestmentDashboardView
      dashboard={dashboard}
      chartData={chartData}
      watchlist={watchlist}
    />
  );
}
