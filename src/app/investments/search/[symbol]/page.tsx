import {
  getSymbolHistory,
  searchSymbolsWithQuotes,
  isInWatchlist,
  getSymbolNews,
} from "@/lib/investment-actions";
import { SymbolDetailView } from "@/components/symbol-detail-view";

export default async function SymbolDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();

  const [chartData, searchResults, watched, news] = await Promise.all([
    getSymbolHistory(upper),
    searchSymbolsWithQuotes(upper),
    isInWatchlist(upper),
    getSymbolNews(upper),
  ]);

  const match = searchResults.find(
    (r) => r.symbol.toUpperCase() === upper
  );

  return (
    <SymbolDetailView
      symbol={upper}
      name={match?.name ?? upper}
      type={(match?.type as "stock" | "etf") ?? "stock"}
      price={match?.price ?? null}
      chartData={chartData}
      isWatched={watched}
      news={news}
    />
  );
}
