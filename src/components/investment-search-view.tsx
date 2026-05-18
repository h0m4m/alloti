"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Star, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { StockLogo } from "@/components/stock-logo";
import {
  searchSymbolsWithQuotes,
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/investment-actions";

interface WatchlistItem {
  _id: string;
  symbol: string;
  name: string;
  assetType: string;
  price: number | null;
  addedAt: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  price: number | null;
}

interface Props {
  watchlist: WatchlistItem[];
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-14 rounded bg-muted animate-pulse" />
          <div className="h-4 w-10 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-3 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function SearchView({ watchlist: initialWatchlist }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [watchedSymbols, setWatchedSymbols] = useState<Set<string>>(
    new Set(initialWatchlist.map((w) => w.symbol))
  );
  const [togglingSymbol, setTogglingSymbol] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 1) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchSymbolsWithQuotes(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
        setHasSearched(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const toggleWatchlist = useCallback(
    async (item: SearchResult) => {
      setTogglingSymbol(item.symbol);
      const isWatched = watchedSymbols.has(item.symbol);
      const next = new Set(watchedSymbols);

      if (isWatched) {
        next.delete(item.symbol);
        setWatchedSymbols(next);
        try {
          await removeFromWatchlist(item.symbol);
          toast.success(`Removed ${item.symbol}`);
        } catch {
          next.add(item.symbol);
          setWatchedSymbols(next);
        }
      } else {
        next.add(item.symbol);
        setWatchedSymbols(next);
        try {
          await addToWatchlist({
            symbol: item.symbol,
            name: item.name,
            assetType: item.type as "stock" | "etf",
          });
          toast.success(`Added ${item.symbol} to watchlist`);
        } catch {
          next.delete(item.symbol);
          setWatchedSymbols(next);
        }
      }
      setTogglingSymbol(null);
    },
    [watchedSymbols]
  );

  const toggleWatchlistItem = useCallback(
    async (item: WatchlistItem) => {
      setTogglingSymbol(item.symbol);
      const next = new Set(watchedSymbols);
      next.delete(item.symbol);
      setWatchedSymbols(next);
      try {
        await removeFromWatchlist(item.symbol);
        toast.success(`Removed ${item.symbol}`);
        router.refresh();
      } catch {
        next.add(item.symbol);
        setWatchedSymbols(next);
      }
      setTogglingSymbol(null);
    },
    [watchedSymbols, router]
  );

  const showWatchlist = query.length === 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8 space-y-5">
      <PageHeader
        crumbs={[{ label: "Investments", href: "/investments" }]}
        title="Search"
      />

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search stocks, ETFs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Search results */}
      <div
        className={`transition-all duration-300 ease-out ${
          !showWatchlist
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 h-0 overflow-hidden"
        }`}
      >
        {searching && results.length === 0 && (
          <Card className="animate-in fade-in duration-200">
            <CardContent className="p-0 divide-y divide-border">
              {[...Array(4)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </CardContent>
          </Card>
        )}
        {!searching && hasSearched && query.length > 0 && results.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center animate-in fade-in duration-300">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}
        {results.length > 0 && (
          <Card className="animate-in fade-in duration-200">
            <CardContent className="p-0 divide-y divide-border">
              {results.map((r, i) => (
                <div
                  key={r.symbol}
                  className="flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-muted/50 active:bg-muted/70"
                  style={{
                    animation: `fadeSlideIn 250ms ease-out ${i * 40}ms both`,
                  }}
                >
                  <div
                    className="min-w-0 flex-1 cursor-pointer flex items-center gap-3"
                    onClick={() =>
                      router.push(`/investments/search/${r.symbol}`)
                    }
                  >
                    <StockLogo symbol={r.symbol} size={32} />
                    <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{r.symbol}</span>
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: "rgba(59,130,246,0.15)",
                          color: "rgb(59,130,246)",
                        }}
                      >
                        {r.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {r.name}
                    </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {r.price != null && (
                      <span className="text-sm font-medium tabular-nums">
                        ${r.price.toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => toggleWatchlist(r)}
                      disabled={togglingSymbol === r.symbol}
                      className="p-1 transition-transform duration-150 hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                      <Star
                        className={`h-4.5 w-4.5 transition-all duration-200 ${
                          watchedSymbols.has(r.symbol)
                            ? "fill-yellow-500 text-yellow-500 scale-110"
                            : "text-muted-foreground scale-100"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Watchlist */}
      <div
        className={`transition-all duration-300 ease-out ${
          showWatchlist
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 h-0 overflow-hidden"
        }`}
      >
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Watchlist
          </h2>
          {initialWatchlist.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Search for stocks and ETFs to add to your watchlist
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {initialWatchlist.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/50 active:bg-muted/70"
                  >
                    <StockLogo symbol={item.symbol} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {item.symbol}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor: "rgba(59,130,246,0.15)",
                            color: "rgb(59,130,246)",
                          }}
                        >
                          {item.assetType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {item.price != null && (
                        <span className="text-sm font-medium tabular-nums">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                      <button
                        onClick={() => toggleWatchlistItem(item)}
                        disabled={togglingSymbol === item.symbol}
                        className="p-1 transition-transform duration-150 hover:scale-110 active:scale-95 disabled:opacity-50"
                      >
                        <Star className="h-4.5 w-4.5 fill-yellow-500 text-yellow-500 transition-all duration-200" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
