"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ValueChart } from "@/components/value-chart";
import { StockLogo } from "@/components/stock-logo";
import { addToWatchlist, removeFromWatchlist } from "@/lib/investment-actions";

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
}

interface Props {
  symbol: string;
  name: string;
  type: "stock" | "etf";
  price: number | null;
  chartData: { date: string; value: number }[];
  isWatched: boolean;
  news: NewsItem[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function SymbolDetailView({
  symbol,
  name,
  type,
  price,
  chartData,
  isWatched: initialWatched,
  news,
}: Props) {
  const router = useRouter();
  const [watched, setWatched] = useState(initialWatched);

  async function toggleWatch() {
    const next = !watched;
    setWatched(next);
    try {
      if (next) {
        await addToWatchlist({ symbol, name, assetType: type });
        toast.success(`Added ${symbol} to watchlist`);
      } else {
        await removeFromWatchlist(symbol);
        toast.success(`Removed ${symbol}`);
      }
    } catch {
      setWatched(!next);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8 space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          crumbs={[
            { label: "Investments", href: "/investments" },
            { label: "Search", href: "/investments/search" },
          ]}
          title={symbol}
        />
        <button onClick={toggleWatch} className="p-2">
          <Star
            className={`h-5 w-5 transition-colors ${
              watched
                ? "fill-yellow-500 text-yellow-500"
                : "text-muted-foreground"
            }`}
          />
        </button>
      </div>

      {/* Price + Name */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <StockLogo symbol={symbol} size={40} />
            <div>
              <p className="text-sm font-semibold">{symbol}</p>
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          </div>
          {price != null && (
            <p className="text-2xl font-bold mt-0.5">
              ${price.toFixed(2)}
            </p>
          )}
          <span
            className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: "rgba(59,130,246,0.15)",
              color: "rgb(59,130,246)",
            }}
          >
            {type.toUpperCase()}
          </span>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length >= 2 && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <ValueChart data={chartData} height={200} />
          </CardContent>
        </Card>
      )}

      {/* News */}
      {news.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            News
          </h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {news.map((article, i) => (
                <a
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {article.thumbnail && (
                    <img
                      src={article.thumbnail}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-2">
                      {article.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{article.publisher}</span>
                      <span>·</span>
                      <span>{timeAgo(article.publishedAt)}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                </a>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
