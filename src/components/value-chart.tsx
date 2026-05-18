"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

interface DataPoint {
  date: string;
  value: number;
  cost?: number;
}

interface Props {
  data: DataPoint[];
  color?: string;
  showCostBasis?: boolean;
  height?: number;
}

const RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "All", days: 0 },
] as const;

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrency(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0);
}

export function ValueChart({
  data,
  color = "hsl(142, 71%, 45%)",
  showCostBasis = false,
  height = 200,
}: Props) {
  const [range, setRange] = useState<number>(0); // 0 = All

  const filtered =
    range === 0
      ? data
      : (() => {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - range);
          const cutoffStr = cutoff.toISOString().split("T")[0];
          return data.filter((d) => d.date >= cutoffStr);
        })();

  if (filtered.length < 2) return null;

  const values = filtered.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const isPositive = filtered[filtered.length - 1].value >= filtered[0].value;
  const lineColor = isPositive ? color : "hsl(0, 72%, 51%)";

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filtered}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
              {showCostBasis && (
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--muted-foreground))"
                    stopOpacity={0.08}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--muted-foreground))"
                    stopOpacity={0}
                  />
                </linearGradient>
              )}
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={formatShortDate}
              className="fill-muted-foreground"
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              hide
              domain={[minVal * 0.98, maxVal * 1.02]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-card text-card-foreground border border-border rounded-lg px-3 py-2 text-xs shadow-md">
                    <p className="font-medium mb-1">{formatShortDate(String(label))}</p>
                    {payload.map((p, i) => (
                      <p key={i} style={{ color: p.color }}>
                        {p.name}: ${Number(p.value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            {showCostBasis && (
              <Area
                type="monotone"
                dataKey="cost"
                name="Cost Basis"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="url(#costGradient)"
                dot={false}
                activeDot={false}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              name="Value"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#valueGradient)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: lineColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-1 mt-2">
        {RANGES.map((r) => (
          <Button
            key={r.label}
            variant="ghost"
            size="sm"
            className={`h-7 px-2.5 text-xs ${
              range === r.days
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            }`}
            onClick={() => setRange(r.days)}
          >
            {r.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
