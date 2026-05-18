export type Quote = {
  symbol: string;
  price: number;
  currency?: string;
  source: "yahoo" | "manual";
  timestamp?: Date;
  raw?: unknown;
};

export type HistoricalCandle = {
  date: string; // YYYY-MM-DD
  close: number;
};

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getBatchQuotes(symbols: string[]): Promise<Quote[]>;
  getHistoricalPrices(
    symbol: string,
    range?: string
  ): Promise<HistoricalCandle[]>;
}

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_SEARCH = "https://query1.finance.yahoo.com/v1/finance/search";
const HEADERS = { "User-Agent": "Mozilla/5.0" };

export class YahooFinanceProvider implements MarketDataProvider {
  async getQuote(symbol: string): Promise<Quote> {
    const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: HEADERS });

    if (!res.ok) {
      throw new Error(`Yahoo quote failed for ${symbol}: ${res.status}`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error(`No Yahoo data for ${symbol}`);
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice;

    if (!price || price <= 0) {
      throw new Error(`Invalid Yahoo price for ${symbol}: ${price}`);
    }

    return {
      symbol,
      price,
      currency: meta.currency ?? "USD",
      source: "yahoo",
      timestamp: new Date(),
      raw: meta,
    };
  }

  async getBatchQuotes(symbols: string[]): Promise<Quote[]> {
    const results: Quote[] = [];
    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        results.push(quote);
      } catch {
        // Skip failed symbols
      }
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    return results;
  }

  async getHistoricalPrices(
    symbol: string,
    range: string = "1y"
  ): Promise<HistoricalCandle[]> {
    const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
    const res = await fetch(url, { headers: HEADERS });

    if (!res.ok) {
      throw new Error(
        `Yahoo historical failed for ${symbol}: ${res.status}`
      );
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] =
      result.indicators?.quote?.[0]?.close ?? [];

    const candles: HistoricalCandle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close == null) continue;
      candles.push({
        date: new Date(timestamps[i] * 1000).toISOString().split("T")[0],
        close,
      });
    }
    return candles;
  }

  async searchSymbol(
    query: string
  ): Promise<Array<{ symbol: string; description: string; type: string }>> {
    const url = `${YAHOO_SEARCH}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];

    const data = await res.json();
    const quotes = data.quotes ?? [];

    return quotes
      .filter(
        (q: { quoteType: string }) =>
          q.quoteType === "EQUITY" || q.quoteType === "ETF"
      )
      .slice(0, 10)
      .map(
        (q: {
          symbol: string;
          shortname?: string;
          longname?: string;
          quoteType: string;
        }) => ({
          symbol: q.symbol,
          description: q.longname ?? q.shortname ?? q.symbol,
          type: q.quoteType === "ETF" ? "etf" : "stock",
        })
      );
  }
}
