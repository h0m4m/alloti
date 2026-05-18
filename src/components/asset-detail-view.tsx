"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Currency } from "@/components/currency";
import { ValueChart } from "@/components/value-chart";
import { formatDate, formatDateInput } from "@/lib/format";
import {
  setManualPrice,
  updateInvestmentTransaction,
  deleteInvestmentTransaction,
} from "@/lib/investment-actions";
import type {
  InvestmentAsset,
  InvestmentTransaction,
  PriceSnapshot,
} from "@/lib/types";
import type { FullHoldingCalculation } from "@/lib/holdings-calculator";

interface Props {
  detail: {
    asset: InvestmentAsset;
    holding: FullHoldingCalculation;
    transactions: InvestmentTransaction[];
    priceHistory: PriceSnapshot[];
    lastPriceUpdate: string | null;
  };
  priceChart: { date: string; value: number }[];
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

export function AssetDetailView({ detail, priceChart }: Props) {
  const router = useRouter();
  const { asset, holding, transactions, lastPriceUpdate } = detail;
  const cur = asset.currency ?? "USD";
  const [showManualPrice, setShowManualPrice] = useState(false);
  const [manualPriceValue, setManualPriceValue] = useState("");
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

  async function handleManualPrice() {
    const price = parseFloat(manualPriceValue);
    if (isNaN(price) || price <= 0) return;
    setSaving(true);
    try {
      await setManualPrice(asset._id, price);
      toast.success("Price updated");
      setShowManualPrice(false);
      setManualPriceValue("");
      router.refresh();
    } catch {
      toast.error("Failed to update price");
    } finally {
      setSaving(false);
    }
  }

  const editNeedsQuantity = editingTx?.type === "buy" || editingTx?.type === "sell";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          crumbs={[{ label: "Investments", href: "/investments" }]}
          title={asset.symbol}
        >
          <div>
            <h1 className="text-xl font-bold">{asset.symbol}</h1>
            <p className="text-xs text-muted-foreground">{asset.name}</p>
          </div>
        </PageHeader>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowManualPrice(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Update Price</span>
        </Button>
      </div>

      {/* Price Chart */}
      {priceChart.length >= 2 && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <ValueChart data={priceChart} height={180} />
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="text-lg font-bold mt-1">
              <Currency amount={holding.currentValue} currency={cur} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Latest Price</p>
            <p className="text-lg font-bold mt-1">
              <Currency amount={holding.latestPrice} currency={cur} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="text-lg font-bold mt-1">
              {holding.quantity.toFixed(4)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Cost</p>
            <p className="text-lg font-bold mt-1">
              <Currency amount={holding.averageCost} currency={cur} />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* P/L Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Unrealized P/L</p>
            <div className="flex items-center gap-1 mt-0.5">
              {holding.unrealizedGainLoss >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              <p
                className={`text-sm font-semibold ${
                  holding.unrealizedGainLoss >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <Currency amount={Math.abs(holding.unrealizedGainLoss)} currency={cur} />
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Realized P/L</p>
            <p
              className={`text-sm font-semibold mt-0.5 ${
                holding.realizedGainLoss >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {holding.realizedGainLoss >= 0 ? "+" : ""}
              <Currency amount={Math.abs(holding.realizedGainLoss)} currency={cur} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Dividends</p>
            <p className="text-sm font-semibold mt-0.5 text-blue-600">
              <Currency amount={holding.dividendsReceived} currency={cur} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Return</p>
            <p
              className={`text-sm font-semibold mt-0.5 ${
                holding.totalReturn >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <Currency amount={Math.abs(holding.totalReturn)} currency={cur} /> (
              {holding.totalReturnPercentage >= 0 ? "+" : ""}
              {holding.totalReturnPercentage.toFixed(2)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Last Update */}
      {lastPriceUpdate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Price updated {formatDate(lastPriceUpdate)}
        </div>
      )}
      {!lastPriceUpdate && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <Clock className="h-3 w-3" />
          Price data has not been updated yet. The app will update prices
          automatically, or you can enter a manual price.
        </div>
      )}

      {/* Transaction History */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Transaction History
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {[...transactions].reverse().map((tx: InvestmentTransaction) => (
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
                      <p className="text-sm">
                        {tx.quantity ? `${tx.quantity} shares` : ""}
                        {tx.pricePerUnit ? (
                          <>
                            {" "}
                            @ <Currency amount={tx.pricePerUnit} currency={cur} />
                          </>
                        ) : (
                          ""
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.transactionDate)}
                        {tx.note ? ` · ${tx.note}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <p className="text-sm font-medium">
                      <Currency amount={tx.totalAmount} currency={cur} />
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
        )}
      </section>

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

      {/* Manual Price Dialog */}
      <Dialog open={showManualPrice} onOpenChange={setShowManualPrice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Price for {asset.symbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Price ({asset.currency})</Label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder="162.00"
                value={manualPriceValue}
                onChange={(e) => setManualPriceValue(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleManualPrice}
              disabled={saving || !manualPriceValue}
            >
              {saving ? "Saving..." : "Update Price"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
