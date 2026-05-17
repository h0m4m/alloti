"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  ArrowRight,
  Plus,
  Clock,
  Briefcase,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Currency } from "@/components/currency";
import { AddInvestmentTransactionForm } from "@/components/add-investment-transaction-form";
import { formatDate, formatDateInput } from "@/lib/format";
import {
  updateInvestmentTransaction,
  deleteInvestmentTransaction,
} from "@/lib/investment-actions";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { PortfolioDashboard, InvestmentTransaction } from "@/lib/types";

interface Props {
  dashboard: PortfolioDashboard;
}

const TX_TYPE_LABELS: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  dividend: "Dividend",
};

const TX_TYPE_COLORS: Record<string, string> = {
  buy: "bg-green-500/10 text-green-600 border-green-500/20",
  sell: "bg-red-500/10 text-red-600 border-red-500/20",
  dividend: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export function InvestmentDashboardView({ dashboard }: Props) {
  const router = useRouter();
  const [showAddTx, setShowAddTx] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit transaction state
  const [editingTx, setEditingTx] = useState<InvestmentTransaction | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [editFees, setEditFees] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");

  function openEdit(tx: InvestmentTransaction) {
    setEditingTx(tx);
    setEditQuantity(tx.quantity != null ? String(tx.quantity) : "");
    setEditPrice(tx.pricePerUnit != null ? String(tx.pricePerUnit) : "");
    setEditTotal(String(tx.totalAmount));
    setEditFees(String(tx.fees));
    setEditDate(formatDateInput(new Date(tx.transactionDate)));
    setEditNote(tx.note ?? "");
  }

  async function handleEditSave() {
    if (!editingTx) return;
    setSaving(true);
    try {
      await updateInvestmentTransaction(editingTx._id, {
        quantity: editQuantity ? parseFloat(editQuantity) : null,
        pricePerUnit: editPrice ? parseFloat(editPrice) : null,
        totalAmount: parseFloat(editTotal) || 0,
        fees: parseFloat(editFees) || 0,
        transactionDate: editDate,
        note: editNote || null,
      });
      toast.success("Transaction updated");
      setEditingTx(null);
      router.refresh();
    } catch {
      toast.error("Failed to update transaction");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteInvestmentTransaction(id);
      toast.success("Transaction deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete transaction");
    }
  }

  const hasAccounts = dashboard.accounts.length > 0;
  const hasHoldings = dashboard.holdings.length > 0;
  const editNeedsQuantity = editingTx?.type === "buy" || editingTx?.type === "sell";

  if (!hasAccounts) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8">
        <div className="text-center py-16 sm:py-24 space-y-3">
          <Briefcase className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">
            Start tracking your investments by creating your first investment
            account.
          </p>
          <Link href="/investments/accounts">
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create Investment Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Investments</h1>
        <div className="flex gap-2">
          <Link href="/investments/accounts">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Landmark className="h-4 w-4" />
              <span className="hidden sm:inline">Accounts</span>
            </Button>
          </Link>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAddTx(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Transaction</span>
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Portfolio Value</p>
            <p className="text-lg font-bold mt-1">
              <Currency amount={dashboard.totalPortfolioValue} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Invested</p>
            <p className="text-lg font-bold mt-1">
              <Currency amount={dashboard.totalInvested} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Return</p>
            <div className="flex items-center gap-1.5 mt-1">
              {dashboard.totalReturn >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <p
                className={`text-lg font-bold ${
                  dashboard.totalReturn >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                <Currency amount={Math.abs(dashboard.totalReturn)} />
              </p>
            </div>
            <p
              className={`text-xs ${
                dashboard.totalReturnPercentage >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {dashboard.totalReturnPercentage >= 0 ? "+" : ""}
              {dashboard.totalReturnPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Dividends</p>
            <p className="text-lg font-bold mt-1 text-blue-600">
              <Currency amount={dashboard.totalDividendsReceived} />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gain/Loss Breakdown */}
      <div className="grid gap-3 grid-cols-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Unrealized P/L</p>
            <p
              className={`text-sm font-semibold mt-0.5 ${
                dashboard.totalUnrealizedGainLoss >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {dashboard.totalUnrealizedGainLoss >= 0 ? "+" : ""}
              <Currency amount={Math.abs(dashboard.totalUnrealizedGainLoss)} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Realized P/L</p>
            <p
              className={`text-sm font-semibold mt-0.5 ${
                dashboard.totalRealizedGainLoss >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {dashboard.totalRealizedGainLoss >= 0 ? "+" : ""}
              <Currency amount={Math.abs(dashboard.totalRealizedGainLoss)} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Dividends</p>
            <p className="text-sm font-semibold mt-0.5 text-blue-600">
              <Currency amount={dashboard.totalDividendsReceived} />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Donut */}
      {hasHoldings && <AllocationDonut holdings={dashboard.holdings} />}

      {/* Last Update */}
      {dashboard.lastPriceUpdate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Prices updated {formatDate(dashboard.lastPriceUpdate)}
        </div>
      )}

      {/* Top Holdings */}
      {hasHoldings ? (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Holdings
          </h2>
          <div className="space-y-2">
            {dashboard.holdings.map((h) => (
              <Link
                key={`${h.investmentAccountId}_${h.assetId}`}
                href={`/investments/asset/${h.assetId}`}
              >
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {h.symbol}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {h.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{h.quantity.toFixed(2)} shares</span>
                          <span>
                            Avg <Currency amount={h.averageCost} />
                          </span>
                          <span>{h.allocationPercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          <Currency amount={h.currentValue} />
                        </p>
                        <p
                          className={`text-xs ${
                            h.unrealizedGainLoss >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {h.unrealizedGainLoss >= 0 ? "+" : ""}
                          <Currency amount={Math.abs(h.unrealizedGainLoss)} />
                          {" "}
                          ({h.totalReturnPercentage >= 0 ? "+" : ""}
                          {h.totalReturnPercentage.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-muted-foreground text-sm">
              Add your first stock or ETF transaction to see your holdings and
              performance.
            </p>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowAddTx(true)}
            >
              <Plus className="h-4 w-4" />
              Add Investment Transaction
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {dashboard.recentTransactions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent Transactions
          </h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {dashboard.recentTransactions.map((tx: InvestmentTransaction) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      className={`text-xs shrink-0 ${TX_TYPE_COLORS[tx.type] ?? ""}`}
                    >
                      {TX_TYPE_LABELS[tx.type] ?? tx.type}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        {tx.asset?.symbol ?? "Cash"}{" "}
                        {tx.quantity
                          ? `× ${tx.quantity}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.transactionDate)}
                        {tx.account ? ` · ${tx.account.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-medium">
                      <Currency amount={tx.totalAmount} />
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(tx)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(tx._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Edit Transaction Dialog */}
      <Dialog
        open={!!editingTx}
        onOpenChange={(open) => {
          if (!open) setEditingTx(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit {editingTx ? TX_TYPE_LABELS[editingTx.type] : ""} Transaction
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {editNeedsQuantity && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price per Unit</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fees</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={editFees}
                  onChange={(e) => setEditFees(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker value={editDate} onChange={setEditDate} />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Optional note"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEditSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <AddInvestmentTransactionForm
        open={showAddTx}
        onClose={() => setShowAddTx(false)}
        accounts={dashboard.accounts}
      />
    </div>
  );
}

// ── Allocation Donut ──

const DONUT_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(25, 95%, 53%)",
  "hsl(280, 67%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(45, 93%, 47%)",
  "hsl(172, 66%, 50%)",
  "hsl(330, 81%, 60%)",
];

import type { HoldingData } from "@/lib/types";

function AllocationDonut({ holdings }: { holdings: HoldingData[] }) {
  const data = holdings
    .filter((h) => h.currentValue > 0)
    .map((h) => ({
      symbol: h.symbol,
      name: h.name,
      value: h.currentValue,
      pct: h.allocationPercentage,
    }));

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="w-fit">
      <CardContent className="p-3">
        <div className="flex items-center gap-4">
          <div className="relative h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="symbol"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-semibold">
                {data.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {data.length === 1 ? "asset" : "assets"}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            {data.map((item, i) => (
              <div key={item.symbol} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="truncate">{item.symbol}</span>
                </div>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {item.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
