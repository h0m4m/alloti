import { getWatchlist } from "@/lib/investment-actions";
import { SearchView } from "@/components/investment-search-view";

export default async function InvestmentSearchPage() {
  const watchlist = await getWatchlist();
  return <SearchView watchlist={watchlist} />;
}
