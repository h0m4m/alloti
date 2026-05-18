"use client";

import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { Currency } from "@/components/currency";
import { AddInvestmentTransactionForm } from "@/components/add-investment-transaction-form";
import { formatDate, formatDateInput } from "@/lib/format";
import {
  updateInvestmentTransaction,
  deleteInvestmentTransaction,
  syncPrices,
} from "@/lib/investment-actions";
import { ValueChart } from "@/components/value-chart";
import { StockLogo } from "@/components/stock-logo";
import type { PortfolioDashboard, InvestmentTransaction } from "@/lib/types";

interface ChartPoint {
  date: string;
  value: number;
  cost: number;
}

interface WatchlistEntry {
  _id: string;
  symbol: string;
  name: string;
  assetType: string;
  price: number | null;
  addedAt: string;
}

interface Props {
  dashboard: PortfolioDashboard;
  chartData: ChartPoint[];
  watchlist: WatchlistEntry[];
}

const TX_TYPE_LABELS: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  dividend: "Dividend",
};

const TX_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  buy: { bg: "rgba(34,197,94,0.15)", text: "rgb(34,197,94)" },
  sell: { bg: "rgba(239,68,68,0.15)", text: "rgb(239,68,68)" },
  dividend: { bg: "rgba(59,130,246,0.15)", text: "rgb(59,130,246)" },
};

export function InvestmentDashboardView({ dashboard, chartData, watchlist }: Props) {
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

  // Sync prices state
  const [syncing, setSyncing] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSync = useCallback(async () => {
    if (syncing || cooldown > 0) return;
    setSyncing(true);
    try {
      const result = await syncPrices();
      if (result.success) {
        toast.success(`Prices updated (${result.updated} symbol${result.updated === 1 ? "" : "s"})`);
        setCooldown(300); // 5 min
        router.refresh();
      } else if (result.error === "cooldown") {
        setCooldown(result.cooldownRemaining ?? 300);
        toast.error(`Please wait ${formatCooldown(result.cooldownRemaining ?? 0)}`);
      } else {
        toast.error(result.error ?? "Sync failed");
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [syncing, cooldown, router]);

  const hasAccounts = dashboard.accounts.length > 0;
  const hasHoldings = dashboard.holdings.length > 0;
  const investCurrency = dashboard.accounts[0]?.currency ?? "USD";
  const editNeedsQuantity = editingTx?.type === "buy" || editingTx?.type === "sell";

  if (!hasAccounts) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8">
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
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="Investments" />
        <div className="flex gap-2">
          <Link href="/investments/search">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </Link>
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
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* Value + Stats in one row */}
          <div className={`grid gap-3 ${dashboard.totalDividendsReceived > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            <div>
              <p className="text-[11px] text-muted-foreground">Portfolio Value</p>
              <p className="text-lg font-bold mt-0.5">
                <Currency amount={dashboard.totalPortfolioValue} currency={investCurrency} />
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {dashboard.totalReturn >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={`text-xs font-medium ${
                    dashboard.totalReturn >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {dashboard.totalReturnPercentage >= 0 ? "+" : ""}
                  {dashboard.totalReturnPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Invested</p>
              <p className="text-lg font-bold mt-0.5">
                <Currency amount={dashboard.totalInvested} currency={investCurrency} />
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Unrealized P/L</p>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  dashboard.totalUnrealizedGainLoss >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {dashboard.totalUnrealizedGainLoss >= 0 ? "+" : ""}
                <Currency amount={Math.abs(dashboard.totalUnrealizedGainLoss)} currency={investCurrency} />
              </p>
            </div>
            {dashboard.totalDividendsReceived > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground">Dividends</p>
                <p className="text-lg font-bold mt-0.5 text-blue-600">
                  <Currency amount={dashboard.totalDividendsReceived} currency={investCurrency} />
                </p>
              </div>
            )}
          </div>

          {/* Allocation bar */}
          {hasHoldings && <AllocationBar holdings={dashboard.holdings} />}
        </CardContent>
      </Card>

      {/* Portfolio Chart */}
      {chartData.length >= 2 && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <ValueChart data={chartData} showCostBasis />
          </CardContent>
        </Card>
      )}

      {/* Holdings */}
      {hasHoldings ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Holdings
            </h2>
            <div className="flex items-center gap-2">
              {dashboard.lastPriceUpdate && (
                <span className="text-xs text-muted-foreground">
                  {formatDate(dashboard.lastPriceUpdate)}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={syncing || cooldown > 0}
                onClick={handleSync}
                title={cooldown > 0 ? `Wait ${formatCooldown(cooldown)}` : "Sync prices"}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              </Button>
              {cooldown > 0 && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {formatCooldown(cooldown)}
                </span>
              )}
            </div>
          </div>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {dashboard.holdings.map((h) => (
                <Link
                  key={`${h.investmentAccountId}_${h.assetId}`}
                  href={`/investments/asset/${h.assetId}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 first:rounded-t-xl last:rounded-b-xl"
                >
                    <StockLogo symbol={h.symbol} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {h.symbol}
                        </span>
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                          {h.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{h.quantity.toFixed(2)} shares</span>
                        <span className="hidden sm:inline">
                          Avg <Currency amount={h.averageCost} currency={investCurrency} />
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        <Currency amount={h.currentValue} currency={investCurrency} />
                      </p>
                      <p
                        className={`text-xs ${
                          h.unrealizedGainLoss >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {h.unrealizedGainLoss >= 0 ? "+" : ""}
                        {h.totalReturnPercentage.toFixed(2)}%
                      </p>
                    </div>
                </Link>
              ))}
            </CardContent>
          </Card>
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

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Watchlist
            </h2>
            <Link href="/investments/search" className="text-xs text-muted-foreground hover:text-foreground">
              Edit
            </Link>
          </div>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {watchlist.map((w) => (
                <Link
                  key={w._id}
                  href={`/investments/search/${w.symbol}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 first:rounded-t-xl last:rounded-b-xl"
                >
                  <StockLogo symbol={w.symbol} size={32} />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold">{w.symbol}</span>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {w.name}
                    </p>
                  </div>
                  {w.price != null && (
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      ${w.price.toFixed(2)}
                    </span>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
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
                    <span
                      className="inline-flex items-center justify-center w-16 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        backgroundColor: TX_TYPE_COLORS[tx.type]?.bg ?? "rgba(128,128,128,0.15)",
                        color: TX_TYPE_COLORS[tx.type]?.text ?? "rgb(128,128,128)",
                      }}
                    >
                      {TX_TYPE_LABELS[tx.type] ?? tx.type}
                    </span>
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    <p className="text-sm font-medium">
                      <Currency amount={tx.totalAmount} currency={investCurrency} />
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="h-7 w-7" />}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(tx)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(tx._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function AllocationBar({ holdings }: { holdings: HoldingData[] }) {
  const data = holdings
    .filter((h) => h.currentValue > 0)
    .map((h) => ({
      symbol: h.symbol,
      pct: h.allocationPercentage,
    }));

  if (data.length === 0) return null;

  return (
    <div className="pt-3 border-t border-border space-y-2">
      {/* Stacked bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden">
        {data.map((item, i) => (
          <div
            key={item.symbol}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${item.pct}%`,
              backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
            }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map((item, i) => (
          <div key={item.symbol} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="text-xs text-muted-foreground">
              {item.symbol} {item.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
