export type Quote = {
  symbol: string;
  price: number;
  currency?: string;
  source: "finnhub" | "manual";
  timestamp?: Date;
  raw?: unknown;
};

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getBatchQuotes(symbols: string[]): Promise<Quote[]>;
}

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export class FinnhubMarketDataProvider implements MarketDataProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Finnhub quote failed for ${symbol}: ${res.status}`);
    }

    const data = await res.json();

    if (!data.c || data.c <= 0) {
      throw new Error(`Invalid Finnhub price for ${symbol}: c=${data.c}`);
    }

    return {
      symbol,
      price: data.c,
      source: "finnhub",
      timestamp: data.t ? new Date(data.t * 1000) : new Date(),
      raw: data,
    };
  }

  async getBatchQuotes(symbols: string[]): Promise<Quote[]> {
    const results: Quote[] = [];

    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        results.push(quote);
      } catch {
        // Skip failed symbols — caller handles missing quotes
      }
      // Basic rate limiting: 200ms between calls (Finnhub free tier: 60 calls/min)
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  async searchSymbol(query: string): Promise<Array<{ symbol: string; description: string; type: string }>> {
    const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${this.apiKey}`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.result) return [];

    return data.result
      .filter((r: { type: string }) => r.type === "Common Stock" || r.type === "ETP")
      .slice(0, 10)
      .map((r: { symbol: string; description: string; type: string }) => ({
        symbol: r.symbol,
        description: r.description,
        type: r.type === "ETP" ? "etf" : "stock",
      }));
  }
}
