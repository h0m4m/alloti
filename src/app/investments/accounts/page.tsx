import { getInvestmentAccounts } from "@/lib/investment-actions";
import { InvestmentAccountsView } from "@/components/investment-accounts-view";

export default async function InvestmentAccountsPage() {
  const accounts = await getInvestmentAccounts();
  return <InvestmentAccountsView accounts={accounts} />;
}
