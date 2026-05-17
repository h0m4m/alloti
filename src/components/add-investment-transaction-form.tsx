"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createInvestmentTransaction,
  createInvestmentAsset,
  getInvestmentAssets,
  searchAssetSymbol,
  getLatestPrice,
} from "@/lib/investment-actions";
import { formatDateInput } from "@/lib/format";
import type {
  InvestmentAccount,
  InvestmentAsset,
  InvestmentTransactionType,
} from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: InvestmentAccount[];
}

const TX_TYPES: { value: InvestmentTransactionType; label: string }[] = [
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
  { value: "dividend", label: "Dividend" },
];

const ASSET_TYPES: InvestmentTransactionType[] = [
  "buy",
  "sell",
  "dividend",
  "fee",
  "split",
];

export function AddInvestmentTransactionForm({
  open,
  onClose,
  accounts,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [accountId, setAccountId] = useState(accounts[0]?._id ?? "");
  const [txType, setTxType] = useState<InvestmentTransactionType>("buy");
  const [assetId, setAssetId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset | null>(null);
  const [quantity, setQuantity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [fees, setFees] = useState("");
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [note, setNote] = useState("");
  const [splitNum, setSplitNum] = useState("");
  const [splitDen, setSplitDen] = useState("");

  // Asset combobox
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [assetQuery, setAssetQuery] = useState("");
  const [assetResults, setAssetResults] = useState<
    Array<{ symbol: string; description: string; type: string }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const needsAsset = ASSET_TYPES.includes(txType);
  const needsQuantity = txType === "buy" || txType === "sell";
  const needsPrice = txType === "buy" || txType === "sell";
  const needsSplit = txType === "split";

  useEffect(() => {
    if (open) {
      getInvestmentAssets().then(setAssets);
    }
  }, [open]);

  // Auto-calculate total amount for buy/sell
  useEffect(() => {
    if (needsQuantity && needsPrice && quantity && pricePerUnit) {
      const q = parseFloat(quantity);
      const p = parseFloat(pricePerUnit);
      const f = parseFloat(fees) || 0;
      if (!isNaN(q) && !isNaN(p)) {
        setTotalAmount((q * p + (txType === "buy" ? f : -f)).toFixed(2));
      }
    }
  }, [quantity, pricePerUnit, fees, needsQuantity, needsPrice, txType]);

  // Debounced Finnhub search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setAssetResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchAssetSymbol(q);
      setAssetResults(results);
    } catch {
      setAssetResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!assetQuery || selectedAsset) return;
    const timer = setTimeout(() => doSearch(assetQuery), 400);
    return () => clearTimeout(timer);
  }, [assetQuery, doSearch, selectedAsset]);

  // Merge local assets + Finnhub results into one dropdown
  const filteredLocalAssets = assetQuery
    ? assets.filter(
        (a) =>
          a.symbol.includes(assetQuery) ||
          a.name.toLowerCase().includes(assetQuery.toLowerCase())
      )
    : assets;

  // Remote results that aren't already in local assets
  const remoteOnly = assetResults.filter(
    (r) => !assets.some((a) => a.symbol === r.symbol)
  );

  const hasResults = filteredLocalAssets.length > 0 || remoteOnly.length > 0;

  async function fillPrice(assetId: string) {
    if (!needsPrice) return;
    const price = await getLatestPrice(assetId);
    if (price) setPricePerUnit(String(price));
  }

  async function pickAsset(asset: InvestmentAsset) {
    setAssetId(asset._id);
    setSelectedAsset(asset);
    setAssetQuery(asset.symbol);
    setShowDropdown(false);
    setAssetResults([]);
    fillPrice(asset._id);
  }

  async function pickRemoteResult(result: {
    symbol: string;
    description: string;
    type: string;
  }) {
    const asset = await createInvestmentAsset({
      symbol: result.symbol,
      name: result.description,
      assetType: result.type as "stock" | "etf",
      currency: "USD",
    });
    setAssetId(asset._id);
    setSelectedAsset(asset);
    setAssetQuery(asset.symbol);
    setShowDropdown(false);
    setAssetResults([]);
    setAssets((prev) =>
      prev.some((a) => a._id === asset._id) ? prev : [...prev, asset]
    );
    fillPrice(asset._id);
  }

  function clearAsset() {
    setAssetId(null);
    setSelectedAsset(null);
    setAssetQuery("");
    setAssetResults([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function reset() {
    setTxType("buy");
    setAssetId(null);
    setSelectedAsset(null);
    setQuantity("");
    setPricePerUnit("");
    setTotalAmount("");
    setFees("");
    setDate(formatDateInput(new Date()));
    setNote("");
    setSplitNum("");
    setSplitDen("");
    setAssetQuery("");
    setAssetResults([]);
    setShowDropdown(false);
  }

  async function handleSubmit() {
    if (!accountId) return;
    if (needsAsset && !assetId) {
      toast.error("Please select an asset");
      return;
    }

    setSaving(true);
    try {
      await createInvestmentTransaction({
        investmentAccountId: accountId,
        assetId: needsAsset ? assetId : null,
        type: txType,
        quantity: needsQuantity ? parseFloat(quantity) : null,
        pricePerUnit: needsPrice ? parseFloat(pricePerUnit) : null,
        totalAmount: parseFloat(totalAmount) || 0,
        fees: parseFloat(fees) || 0,
        currency: accounts.find((a) => a._id === accountId)?.currency ?? "USD",
        transactionDate: date,
        note: note || null,
        splitRatioNumerator: needsSplit ? parseInt(splitNum) : null,
        splitRatioDenominator: needsSplit ? parseInt(splitDen) : null,
      });
      toast.success("Transaction recorded");
      reset();
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save transaction"
      );
    } finally {
      setSaving(false);
    }
  }

  const accountItems = Object.fromEntries(
    accounts.map((a) => [a._id, a.name])
  );
  const txTypeItems = Object.fromEntries(
    TX_TYPES.map((t) => [t.value, t.label])
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Investment Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Account + Type on one row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={accountId}
                onValueChange={(v) => { if (v) setAccountId(v); }}
                items={accountItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={txType}
                onValueChange={(v) => {
                  if (v) setTxType(v as InvestmentTransactionType);
                }}
                items={txTypeItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TX_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Asset combobox */}
          {needsAsset && (
            <div className="space-y-2">
              <Label>Asset</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search symbol (e.g. AAPL)"
                  className="pl-9 pr-9"
                  value={selectedAsset ? `${selectedAsset.symbol} — ${selectedAsset.name}` : assetQuery}
                  onChange={(e) => {
                    if (selectedAsset) {
                      clearAsset();
                      setAssetQuery(e.target.value.toUpperCase());
                    } else {
                      setAssetQuery(e.target.value.toUpperCase());
                    }
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (!selectedAsset) setShowDropdown(true);
                  }}
                  onBlur={() => {
                    // Delay to allow click on dropdown items
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  readOnly={!!selectedAsset}
                />
                {selectedAsset && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={clearAsset}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {searching && !selectedAsset && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}
              </div>

              {showDropdown && !selectedAsset && (hasResults || searching) && (
                <div className="border rounded-md max-h-48 overflow-y-auto bg-popover shadow-md">
                  {/* Local assets */}
                  {filteredLocalAssets.length > 0 && (
                    <>
                      {filteredLocalAssets.map((a) => (
                        <button
                          key={a._id}
                          type="button"
                          className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickAsset(a)}
                        >
                          <span className="font-medium">{a.symbol}</span>
                          <span className="text-xs text-muted-foreground truncate ml-2">
                            {a.name}
                          </span>
                        </button>
                      ))}
                      {remoteOnly.length > 0 && (
                        <div className="border-t border-border" />
                      )}
                    </>
                  )}

                  {/* Remote Finnhub results */}
                  {remoteOnly.map((r) => (
                    <button
                      key={r.symbol}
                      type="button"
                      className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickRemoteResult(r)}
                    >
                      <span className="font-medium">{r.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate ml-2">
                        {r.description}
                      </span>
                    </button>
                  ))}

                  {searching && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      Searching Finnhub...
                    </p>
                  )}

                  {!searching && !hasResults && assetQuery.length > 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      No results found
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quantity & Price */}
          {needsQuantity && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Unit</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="150.00"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Split Ratio */}
          {needsSplit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>New Shares</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="2"
                  value={splitNum}
                  onChange={(e) => setSplitNum(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>For Every</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={splitDen}
                  onChange={(e) => setSplitDen(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Total Amount */}
          <div className="space-y-2">
            <Label>Total Amount</Label>
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="1500.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>

          {/* Fees */}
          {(txType === "buy" || txType === "sell" || txType === "fee") && (
            <div className="space-y-2">
              <Label>Fees</Label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={saving || !accountId}
          >
            {saving ? "Saving..." : "Record Transaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
