let _currency = "USD";

export function setCurrencyCode(code: string) {
  _currency = code;
}

export function getCurrencyCode() {
  return _currency;
}

/** Currencies that need a custom SVG or text symbol instead of Intl default */
export const CUSTOM_CURRENCY_ICON: Record<string, string> = {
  AED: "/dirham.svg",
};

const CUSTOM_TEXT_SYMBOLS: Record<string, string> = {
  AED: "د.إ",
  EGP: "E£",
};

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency?: string): string {
  const code = currency || _currency;
  const textSymbol = CUSTOM_TEXT_SYMBOLS[code];
  if (textSymbol) {
    return `${textSymbol} ${formatNumber(amount)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Returns the symbol/prefix and formatted number separately.
 * Used by the <Currency> React component to render SVG icons inline.
 */
export function parseCurrencyParts(amount: number, currency?: string): { symbol: string; value: string; code: string } {
  const code = currency || _currency;
  const textSymbol = CUSTOM_TEXT_SYMBOLS[code];
  if (textSymbol) {
    return { symbol: textSymbol, value: formatNumber(amount), code };
  }
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  // Extract symbol from Intl output (e.g. "$100" → "$", "100")
  const match = formatted.match(/^([^\d]*)([\d,.]*)(.*)$/);
  if (match) {
    return { symbol: match[1].trim(), value: match[2] + match[3], code };
  }
  return { symbol: "", value: formatted, code };
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function daysRemaining(endDate: string | Date): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function percentSpent(spent: number, allocated: number): number {
  if (allocated === 0) return 0;
  return Math.min(100, Math.round((spent / allocated) * 100));
}
