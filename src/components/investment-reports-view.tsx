"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Currency } from "@/components/currency";
import { formatCurrency } from "@/lib/format";
import type { HoldingData } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HistoryPoint {
  date: string;
  totalValue: number;
  totalCost: number;
}

interface Props {
  holdings: HoldingData[];
  history: HistoryPoint[];
}

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(25, 95%, 53%)",
  "hsl(280, 67%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(45, 93%, 47%)",
  "hsl(172, 66%, 50%)",
  "hsl(330, 81%, 60%)",
];

export function InvestmentReportsView({ holdings, history }: Props) {
  const hasHoldings = holdings.length > 0;
  const hasHistory = history.length > 0;

  // Allocation data
  const allocationData = holdings
    .filter((h) => h.currentValue > 0)
    .map((h) => ({
      name: h.symbol,
      value: h.currentValue,
      percentage: h.allocationPercentage,
    }));

  // Allocation by asset type
  const typeMap = new Map<string, number>();
  for (const h of holdings) {
    if (h.currentValue > 0) {
      const key = h.assetType === "etf" ? "ETF" : h.assetType === "stock" ? "Stock" : h.assetType;
      typeMap.set(key, (typeMap.get(key) ?? 0) + h.currentValue);
    }
  }
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const typeData = [...typeMap.entries()].map(([name, value]) => ({
    name,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }));

  // Gain/loss bar data
  const gainLossData = holdings
    .filter((h) => h.quantity > 0)
    .map((h) => ({
      symbol: h.symbol,
      unrealized: h.unrealizedGainLoss,
      realized: h.realizedGainLoss,
      dividends: h.dividendsReceived,
    }));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8 space-y-6">
      <PageHeader
        crumbs={[{ label: "Investments", href: "/investments" }]}
        title="Reports"
      />

      {!hasHoldings ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            Add some investment transactions to see reports.
          </p>
        </div>
      ) : (
        <>
          {/* Portfolio Value Over Time */}
          {hasHistory && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-medium">Portfolio Value Over Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalValue"
                        name="Value"
                        stroke="hsl(221, 83%, 53%)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalCost"
                        name="Cost Basis"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Allocation by Asset */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-medium">Allocation by Asset</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                        }
                        labelLine={false}
                      >
                        {allocationData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {allocationData.map((item, i) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        <Currency amount={item.value} /> ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Allocation by Type */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-medium">Allocation by Type</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                        }
                        labelLine={false}
                      >
                        {typeData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[(i + 3) % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {typeData.map((item, i) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              COLORS[(i + 3) % COLORS.length],
                          }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        <Currency amount={item.value} /> ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gain/Loss by Asset */}
          {gainLossData.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-medium">
                  Gain/Loss by Asset
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gainLossData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="symbol"
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="unrealized"
                        name="Unrealized"
                        fill="hsl(221, 83%, 53%)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="realized"
                        name="Realized"
                        fill="hsl(142, 71%, 45%)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="dividends"
                        name="Dividends"
                        fill="hsl(45, 93%, 47%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
