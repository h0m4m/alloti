"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface Merchant {
  name: string;
  total: number;
  count: number;
}

interface Props {
  merchants: Merchant[];
}

export function TopMerchantsChart({ merchants }: Props) {
  const data = merchants.slice(0, 8);
  const max = Math.max(...data.map((m) => m.total), 1);

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-medium">Top Merchants</h3>
        {data.length > 0 ? (
          <div className="space-y-3">
            {data.map((merchant, i) => {
              const pct = (merchant.total / max) * 100;
              return (
                <div key={merchant.name} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm truncate">
                      <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                      {merchant.name}
                    </span>
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      {formatCurrency(merchant.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {merchant.count} transaction{merchant.count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No merchant data available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
