import { getInvestmentDashboard } from "@/lib/investment-actions";
import { InvestmentDashboardView } from "@/components/investment-dashboard-view";

export default async function InvestmentsPage() {
  const dashboard = await getInvestmentDashboard();
  return <InvestmentDashboardView dashboard={dashboard} />;
}
