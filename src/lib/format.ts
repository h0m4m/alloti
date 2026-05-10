let _currency = "USD";

export function setCurrencyCode(code: string) {
  _currency = code;
}

export function getCurrencyCode() {
  return _currency;
}

export function formatCurrency(amount: number, currency?: string): string {
  const code = currency || _currency;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
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
