import { getHoldings, getPortfolioHistory } from "@/lib/investment-actions";
import { InvestmentReportsView } from "@/components/investment-reports-view";

export default async function InvestmentReportsPage() {
  const [holdings, history] = await Promise.all([
    getHoldings(),
    getPortfolioHistory(90),
  ]);
  return <InvestmentReportsView holdings={holdings} history={history} />;
}
