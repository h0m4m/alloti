import { parseCurrencyParts, CUSTOM_CURRENCY_ICON } from "@/lib/format";
import { DirhamIcon } from "@/components/dirham-icon";

export function Currency({
  amount,
  currency,
}: {
  amount: number;
  currency?: string;
}) {
  const { symbol, value, code } = parseCurrencyParts(amount, currency);
  const hasIcon = code in CUSTOM_CURRENCY_ICON;

  return (
    <span className="inline-flex items-baseline gap-0.5">
      {hasIcon ? (
        <DirhamIcon className="self-center h-[0.85em] w-[0.85em]" />
      ) : (
        <span>{symbol}</span>
      )}
      <span>{value}</span>
    </span>
  );
}
