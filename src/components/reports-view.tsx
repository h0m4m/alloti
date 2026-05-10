"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import {
  getSpendingByCategoryReport,
  getBudgetVsActualReport,
  getCategoryTrendReport,
} from "@/lib/actions";
import type { BudgetPeriod } from "@/lib/types";
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
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyEntry {
  _id: string;
  name: string;
  startDate: string;
  budget: number;
  spent: number;
  remaining: number;
}

interface Merchant {
  name: string;
  total: number;
  count: number;
}

interface CategorySpending {
  _id: string;
  name: string;
  color: string;
  allocated: number;
  spent: number;
  percentage: number;
}

interface BudgetVsActual {
  _id: string;
  name: string;
  color: string;
  planned: number;
  actual: number;
  difference: number;
}

interface CategoryTrendPoint {
  periodName: string;
  allocated: number;
  spent: number;
}

interface CategoryOption {
  name: string;
  color: string;
}

interface Props {
  periods: BudgetPeriod[];
  monthlyComparison: MonthlyEntry[];
  topMerchants: Merchant[];
  allCategories: CategoryOption[];
}

export function ReportsView({
  periods,
  monthlyComparison,
  topMerchants,
  allCategories,
}: Props) {
  const router = useRouter();
  const [selectedPeriodId, setSelectedPeriodId] = useState(
    periods[0]?._id || ""
  );
  const [categoryReport, setCategoryReport] = useState<{
    periodName: string;
    totalSpent: number;
    totalBudget: number;
    categories: CategorySpending[];
  } | null>(null);
  const [budgetVsActual, setBudgetVsActual] = useState<{
    periodName: string;
    totalPlanned: number;
    totalActual: number;
    totalDifference: number;
    categories: BudgetVsActual[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [trendCategory, setTrendCategory] = useState(
    allCategories[0]?.name || ""
  );
  const [trendData, setTrendData] = useState<CategoryTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  async function loadCategoryTrend(categoryName: string) {
    if (!categoryName) return;
    setTrendLoading(true);
    setTrendCategory(categoryName);
    const data = await getCategoryTrendReport(categoryName);
    setTrendData(data);
    setTrendLoading(false);
  }

  async function loadReports(periodId: string) {
    if (!periodId) return;
    setLoading(true);
    setSelectedPeriodId(periodId);
    const [catReport, bvaReport] = await Promise.all([
      getSpendingByCategoryReport(periodId),
      getBudgetVsActualReport(periodId),
    ]);
    setCategoryReport(catReport);
    setBudgetVsActual(bvaReport);
    setLoading(false);
  }

  const tooltipStyle = {
    borderRadius: "8px",
    border: "none",
    background: "rgba(0,0,0,0.85)",
    color: "#fff",
    fontSize: "13px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  };

  const tickStyle = { fontSize: 12, fill: "#a1a1aa" };

  // Load initial reports
  useEffect(() => {
    if (selectedPeriodId) {
      loadReports(selectedPeriodId);
    }
    if (trendCategory) {
      loadCategoryTrend(trendCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="Reports" />
        {periods.length > 0 && (
          <Select
            value={selectedPeriodId}
            onValueChange={(v) => {
              if (v) loadReports(v);
            }}
            items={Object.fromEntries(
              periods.map((p) => [p._id, p.name])
            )}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="Select budget" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {periods.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            Create a budget to see reports
          </p>
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Loading reports...
        </p>
      )}

      {/* Spending by Category - Donut Chart */}
      {categoryReport && !loading && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Spending by Category</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/2 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryReport.categories.filter(
                          (c) => c.spent > 0
                        )}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="spent"
                        nameKey="name"
                        strokeWidth={0}
                      >
                        {categoryReport.categories
                          .filter((c) => c.spent > 0)
                          .map((cat) => (
                            <Cell key={cat._id} fill={cat.color} />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2">
                  {categoryReport.categories.map((cat) => (
                    <div
                      key={cat._id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-medium">
                          {formatCurrency(cat.spent)}
                        </span>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(categoryReport.totalSpent)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Budget vs Actual - Two Donuts */}
      {budgetVsActual && !loading && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Budget vs Actual</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Planned Donut */}
                <div className="space-y-2">
                  <p className="text-center text-xs font-medium text-muted-foreground">
                    Planned
                  </p>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={budgetVsActual.categories.filter(
                            (c) => c.planned > 0
                          )}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="planned"
                          nameKey="name"
                          strokeWidth={0}
                        >
                          {budgetVsActual.categories
                            .filter((c) => c.planned > 0)
                            .map((cat) => (
                              <Cell key={cat._id} fill={cat.color} />
                            ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => {
                            const numValue = Number(value);
                            const pct =
                              budgetVsActual.totalPlanned > 0
                                ? Math.round(
                                    (numValue / budgetVsActual.totalPlanned) * 100
                                  )
                                : 0;
                            return `${formatCurrency(numValue)} (${pct}%)`;
                          }}
                          contentStyle={tooltipStyle}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-sm font-medium">
                    {formatCurrency(budgetVsActual.totalPlanned)}
                  </p>
                </div>
                {/* Actual Donut */}
                <div className="space-y-2">
                  <p className="text-center text-xs font-medium text-muted-foreground">
                    Actual
                  </p>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={budgetVsActual.categories.filter(
                            (c) => c.actual > 0
                          )}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="actual"
                          nameKey="name"
                          strokeWidth={0}
                        >
                          {budgetVsActual.categories
                            .filter((c) => c.actual > 0)
                            .map((cat) => (
                              <Cell key={cat._id} fill={cat.color} />
                            ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => {
                            const numValue = Number(value);
                            const pct =
                              budgetVsActual.totalActual > 0
                                ? Math.round(
                                    (numValue / budgetVsActual.totalActual) * 100
                                  )
                                : 0;
                            return `${formatCurrency(numValue)} (${pct}%)`;
                          }}
                          contentStyle={tooltipStyle}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-sm font-medium">
                    {formatCurrency(budgetVsActual.totalActual)}
                  </p>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                {budgetVsActual.categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-medium">
                <span>Difference</span>
                <span
                  className={
                    budgetVsActual.totalDifference >= 0
                      ? "text-green-600"
                      : "text-destructive"
                  }
                >
                  {budgetVsActual.totalDifference >= 0 ? "+" : ""}
                  {formatCurrency(budgetVsActual.totalDifference)}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Monthly Comparison - Bar Chart */}
      {monthlyComparison.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Monthly Comparison</h2>
          <Card>
            <CardContent className="p-4">
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyComparison}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(128,128,128,0.2)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={tickStyle}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={tickStyle}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v)}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "rgba(128,128,128,0.15)" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "13px", paddingTop: "8px" }}
                    />
                    <Bar
                      dataKey="budget"
                      name="Budget"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="spent"
                      name="Spent"
                      fill="#22d3ee"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Category Trend - Line Chart */}
      {allCategories.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Category Trend</h2>
            <Select
              value={trendCategory}
              onValueChange={(v) => {
                if (v) loadCategoryTrend(v);
              }}
              items={Object.fromEntries(
                allCategories.map((c) => [c.name, c.name])
              )}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-4">
              {trendLoading && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Loading trend...
                </p>
              )}
              {!trendLoading && trendData.length < 2 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Need at least 2 budget periods with this category to show a
                  trend
                </p>
              )}
              {!trendLoading && trendData.length >= 2 && (
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(128,128,128,0.2)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="periodName"
                        tick={tickStyle}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={tickStyle}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatCurrency(v)}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={tooltipStyle}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "13px", paddingTop: "8px" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="allocated"
                        name="Budget"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="spent"
                        name="Spent"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Top Merchants - Horizontal Bar Chart */}
      {topMerchants.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Top Spending (All Time)</h2>
          <Card>
            <CardContent className="p-4">
              <div
                className="w-full"
                style={{
                  height: `${Math.max(200, topMerchants.slice(0, 10).length * 40 + 40)}px`,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topMerchants.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(128,128,128,0.2)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={tickStyle}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={tickStyle}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === "total" ? "Total" : String(name),
                      ]}
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "rgba(128,128,128,0.15)" }}
                    />
                    <Bar
                      dataKey="total"
                      name="Total"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
