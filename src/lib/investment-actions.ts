"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { InvestmentAccount } from "@/lib/models/investment-account";
import { InvestmentAsset } from "@/lib/models/investment-asset";
import { InvestmentTransaction } from "@/lib/models/investment-transaction";
import { PriceSnapshot } from "@/lib/models/price-snapshot";
import { HoldingSnapshot } from "@/lib/models/holding-snapshot";
import { WatchlistItem } from "@/lib/models/watchlist-item";
import {
  calculateHoldingFromTransactions,
  calculateFullHolding,
} from "@/lib/holdings-calculator";
import { YahooFinanceProvider } from "@/lib/market-data";
import { auth } from "@/auth";
import type {
  InvestmentAccountType,
  AssetType,
  InvestmentTransactionType,
  HoldingData,
  PortfolioDashboard,
} from "@/lib/types";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ── Investment Account Actions ──

export async function createInvestmentAccount(data: {
  name: string;
  type: InvestmentAccountType;
  currency: string;
}) {
  const userId = await requireUser();
  await connectDB();

  const account = await InvestmentAccount.create({
    userId,
    name: data.name,
    type: data.type,
    currency: data.currency,
  });

  revalidatePath("/investments");
  return JSON.parse(JSON.stringify(account));
}

export async function getInvestmentAccounts() {
  const userId = await requireUser();
  await connectDB();
  const accounts = await InvestmentAccount.find({ userId, archived: false })
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(accounts));
}

export async function updateInvestmentAccount(
  id: string,
  data: { name?: string; type?: InvestmentAccountType; currency?: string }
) {
  const userId = await requireUser();
  await connectDB();
  const account = await InvestmentAccount.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { new: true }
  ).lean();
  if (!account) throw new Error("Not found");
  revalidatePath("/investments");
  return JSON.parse(JSON.stringify(account));
}

export async function archiveInvestmentAccount(id: string) {
  const userId = await requireUser();
  await connectDB();
  await InvestmentAccount.findOneAndUpdate(
    { _id: id, userId },
    { $set: { archived: true } }
  );
  revalidatePath("/investments");
}

export async function deleteInvestmentAccount(id: string) {
  const userId = await requireUser();
  await connectDB();
  const account = await InvestmentAccount.findOne({ _id: id, userId });
  if (!account) throw new Error("Not found");
  await InvestmentTransaction.deleteMany({ userId, investmentAccountId: id });
  await HoldingSnapshot.deleteMany({ userId, investmentAccountId: id });
  await InvestmentAccount.findByIdAndDelete(id);
  revalidatePath("/investments");
}

// ── Investment Asset Actions ──

export async function getInvestmentAssets() {
  await requireUser();
  await connectDB();
  const assets = await InvestmentAsset.find().sort({ symbol: 1 }).lean();
  return JSON.parse(JSON.stringify(assets));
}

export async function createInvestmentAsset(data: {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange?: string;
  currency: string;
}) {
  await requireUser();
  await connectDB();

  // Check if symbol already exists
  const existing = await InvestmentAsset.findOne({
    symbol: data.symbol.toUpperCase(),
  });
  if (existing) return JSON.parse(JSON.stringify(existing));

  const asset = await InvestmentAsset.create({
    symbol: data.symbol.toUpperCase(),
    name: data.name,
    assetType: data.assetType,
    exchange: data.exchange || null,
    currency: data.currency,
  });

  revalidatePath("/investments");
  return JSON.parse(JSON.stringify(asset));
}

export async function searchAssetSymbol(query: string) {
  const provider = new YahooFinanceProvider();
  return provider.searchSymbol(query);
}

export async function getLatestPrice(assetId: string): Promise<number | null> {
  await requireUser();
  await connectDB();

  // First check stored snapshots
  const snapshot = await PriceSnapshot.findOne({ assetId })
    .sort({ priceDate: -1 })
    .lean();
  if (snapshot) return snapshot.price;

  // Fallback: fetch live from Yahoo Finance
  const asset = await InvestmentAsset.findById(assetId).lean();
  if (!asset) return null;

  try {
    const provider = new YahooFinanceProvider();
    const quote = await provider.getQuote(asset.symbol);
    return quote.price;
  } catch {
    return null;
  }
}

// ── Investment Transaction Actions ──

export async function createInvestmentTransaction(data: {
  investmentAccountId: string;
  assetId: string | null;
  type: InvestmentTransactionType;
  quantity: number | null;
  pricePerUnit: number | null;
  totalAmount: number;
  fees: number;
  currency: string;
  transactionDate: string;
  note: string | null;
  splitRatioNumerator: number | null;
  splitRatioDenominator: number | null;
}) {
  const userId = await requireUser();
  await connectDB();

  // Validate sell doesn't exceed owned quantity
  if (data.type === "sell" && data.assetId && data.quantity) {
    const transactions = await InvestmentTransaction.find({
      userId,
      investmentAccountId: data.investmentAccountId,
      assetId: data.assetId,
    })
      .sort({ transactionDate: 1, createdAt: 1 })
      .lean();

    const holding = calculateHoldingFromTransactions(transactions);
    if (data.quantity > holding.quantity) {
      throw new Error(
        `Cannot sell ${data.quantity} — you only own ${holding.quantity}`
      );
    }
  }

  const tx = await InvestmentTransaction.create({
    userId,
    investmentAccountId: data.investmentAccountId,
    assetId: data.assetId,
    type: data.type,
    quantity: data.quantity,
    pricePerUnit: data.pricePerUnit,
    totalAmount: data.totalAmount,
    fees: data.fees,
    currency: data.currency,
    transactionDate: new Date(data.transactionDate),
    note: data.note,
    splitRatioNumerator: data.splitRatioNumerator,
    splitRatioDenominator: data.splitRatioDenominator,
  });

  revalidatePath("/investments");
  return JSON.parse(JSON.stringify(tx));
}

export async function getInvestmentTransactions(params?: {
  accountId?: string;
  assetId?: string;
  limit?: number;
}) {
  const userId = await requireUser();
  await connectDB();

  const filter: Record<string, unknown> = { userId };
  if (params?.accountId) filter.investmentAccountId = params.accountId;
  if (params?.assetId) filter.assetId = params.assetId;

  const query = InvestmentTransaction.find(filter)
    .sort({ transactionDate: -1, createdAt: -1 })
    .populate("assetId")
    .populate("investmentAccountId");

  if (params?.limit) query.limit(params.limit);

  const transactions = await query.lean();

  return JSON.parse(
    JSON.stringify(
      transactions.map((tx) => ({
        ...tx,
        asset: tx.assetId && typeof tx.assetId === "object" ? tx.assetId : undefined,
        account:
          tx.investmentAccountId && typeof tx.investmentAccountId === "object"
            ? tx.investmentAccountId
            : undefined,
        assetId:
          tx.assetId && typeof tx.assetId === "object"
            ? (tx.assetId as { _id: string })._id
            : tx.assetId,
        investmentAccountId:
          tx.investmentAccountId && typeof tx.investmentAccountId === "object"
            ? (tx.investmentAccountId as { _id: string })._id
            : tx.investmentAccountId,
      }))
    )
  );
}

export async function updateInvestmentTransaction(
  id: string,
  data: {
    type?: InvestmentTransactionType;
    quantity?: number | null;
    pricePerUnit?: number | null;
    totalAmount?: number;
    fees?: number;
    transactionDate?: string;
    note?: string | null;
  }
) {
  const userId = await requireUser();
  await connectDB();
  const tx = await InvestmentTransaction.findOne({ _id: id, userId });
  if (!tx) throw new Error("Not found");

  const update: Record<string, unknown> = {};
  if (data.type !== undefined) update.type = data.type;
  if (data.quantity !== undefined) update.quantity = data.quantity;
  if (data.pricePerUnit !== undefined) update.pricePerUnit = data.pricePerUnit;
  if (data.totalAmount !== undefined) update.totalAmount = data.totalAmount;
  if (data.fees !== undefined) update.fees = data.fees;
  if (data.transactionDate !== undefined) update.transactionDate = new Date(data.transactionDate);
  if (data.note !== undefined) update.note = data.note;

  await InvestmentTransaction.findByIdAndUpdate(id, { $set: update });
  revalidatePath("/investments");
}

export async function deleteInvestmentTransaction(id: string) {
  const userId = await requireUser();
  await connectDB();
  const tx = await InvestmentTransaction.findOne({ _id: id, userId });
  if (!tx) throw new Error("Not found");
  await InvestmentTransaction.findByIdAndDelete(id);
  revalidatePath("/investments");
}

// ── Manual Price Override ──

export async function setManualPrice(assetId: string, price: number) {
  await requireUser();
  await connectDB();

  const asset = await InvestmentAsset.findById(assetId);
  if (!asset) throw new Error("Asset not found");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await PriceSnapshot.findOneAndUpdate(
    { assetId, priceDate: today, source: "manual" },
    {
      $set: {
        symbol: asset.symbol,
        price,
        currency: asset.currency,
        rawResponseJson: { manualOverride: true },
      },
    },
    { upsert: true }
  );

  revalidatePath("/investments");
}

// ── Holdings Calculation ──

export async function getHoldings(accountId?: string): Promise<HoldingData[]> {
  const userId = await requireUser();
  await connectDB();

  const filter: Record<string, unknown> = { userId };
  if (accountId) filter.investmentAccountId = accountId;

  // Get all transactions grouped by account+asset
  const transactions = await InvestmentTransaction.find({
    ...filter,
    assetId: { $ne: null },
  })
    .sort({ transactionDate: 1, createdAt: 1 })
    .lean();

  // Group transactions by accountId + assetId
  const groups = new Map<
    string,
    { accountId: string; assetId: string; txs: typeof transactions }
  >();

  for (const tx of transactions) {
    const key = `${tx.investmentAccountId}_${tx.assetId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        accountId: String(tx.investmentAccountId),
        assetId: String(tx.assetId),
        txs: [],
      });
    }
    groups.get(key)!.txs.push(tx);
  }

  // Get all relevant assets
  const assetIds = [...new Set([...groups.values()].map((g) => g.assetId))];
  const assets = await InvestmentAsset.find({ _id: { $in: assetIds } }).lean();
  const assetMap = new Map(assets.map((a) => [String(a._id), a]));

  // Get latest prices for each asset
  const latestPrices = new Map<string, { price: number; date: Date }>();
  for (const assetId of assetIds) {
    const snapshot = await PriceSnapshot.findOne({ assetId })
      .sort({ priceDate: -1 })
      .lean();
    if (snapshot) {
      latestPrices.set(assetId, {
        price: snapshot.price,
        date: snapshot.priceDate,
      });
    }
  }

  const holdings: HoldingData[] = [];
  let totalHoldingsValue = 0;

  for (const group of groups.values()) {
    const asset = assetMap.get(group.assetId);
    if (!asset) continue;

    const base = calculateHoldingFromTransactions(group.txs);
    if (base.quantity <= 0 && base.realizedGainLoss === 0 && base.dividendsReceived === 0) {
      continue; // Skip fully closed positions with no history worth showing
    }

    const priceData = latestPrices.get(group.assetId);
    const latestPrice = priceData?.price ?? base.averageCost;

    const full = calculateFullHolding(base, latestPrice);

    totalHoldingsValue += full.currentValue;

    holdings.push({
      assetId: group.assetId,
      investmentAccountId: group.accountId,
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      ...full,
      allocationPercentage: 0, // calculated below
      lastPriceUpdate: priceData?.date?.toISOString() ?? null,
    });
  }

  // Calculate allocation percentages
  for (const h of holdings) {
    h.allocationPercentage =
      totalHoldingsValue > 0 ? (h.currentValue / totalHoldingsValue) * 100 : 0;
  }

  // Sort by current value descending
  holdings.sort((a, b) => b.currentValue - a.currentValue);

  return holdings;
}

export async function getInvestmentDashboard(): Promise<PortfolioDashboard> {
  const userId = await requireUser();
  await connectDB();

  const [accounts, holdings, recentTxRaw] = await Promise.all([
    InvestmentAccount.find({ userId, archived: false }).sort({ createdAt: -1 }).lean(),
    getHoldings(),
    InvestmentTransaction.find({ userId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(10)
      .populate("assetId")
      .populate("investmentAccountId")
      .lean(),
  ]);

  const totalHoldingsValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalPortfolioValue = totalHoldingsValue;
  const totalUnrealizedGainLoss = holdings.reduce(
    (s, h) => s + h.unrealizedGainLoss,
    0
  );
  const totalRealizedGainLoss = holdings.reduce(
    (s, h) => s + h.realizedGainLoss,
    0
  );
  const totalDividendsReceived = holdings.reduce(
    (s, h) => s + h.dividendsReceived,
    0
  );
  const totalReturn =
    totalUnrealizedGainLoss +
    totalRealizedGainLoss +
    totalDividendsReceived;

  const totalInvested = holdings.reduce((s, h) => s + h.costBasis, 0);
  const totalReturnPercentage =
    totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Find last price update
  const latestSnapshot = await PriceSnapshot.findOne()
    .sort({ priceDate: -1 })
    .lean();

  const recentTransactions = recentTxRaw.map((tx) => ({
    ...tx,
    asset: tx.assetId && typeof tx.assetId === "object" ? tx.assetId : undefined,
    account:
      tx.investmentAccountId && typeof tx.investmentAccountId === "object"
        ? tx.investmentAccountId
        : undefined,
    assetId:
      tx.assetId && typeof tx.assetId === "object"
        ? (tx.assetId as { _id: string })._id
        : tx.assetId,
    investmentAccountId:
      tx.investmentAccountId && typeof tx.investmentAccountId === "object"
        ? (tx.investmentAccountId as { _id: string })._id
        : tx.investmentAccountId,
  }));

  return JSON.parse(
    JSON.stringify({
      totalPortfolioValue,
      totalHoldingsValue,
      totalInvested,
      totalUnrealizedGainLoss,
      totalRealizedGainLoss,
      totalDividendsReceived,
      totalReturn,
      totalReturnPercentage,
      lastPriceUpdate: latestSnapshot?.priceDate ?? null,
      holdings,
      recentTransactions,
      accounts,
    })
  );
}

// ── Asset Detail ──

export async function getAssetDetail(assetId: string) {
  const userId = await requireUser();
  await connectDB();

  const [asset, transactions, priceHistory] = await Promise.all([
    InvestmentAsset.findById(assetId).lean(),
    InvestmentTransaction.find({ userId, assetId })
      .sort({ transactionDate: 1, createdAt: 1 })
      .populate("investmentAccountId")
      .lean(),
    PriceSnapshot.find({ assetId })
      .sort({ priceDate: -1 })
      .limit(90)
      .lean(),
  ]);

  if (!asset) throw new Error("Asset not found");

  const base = calculateHoldingFromTransactions(transactions);
  const latestPrice = priceHistory[0]?.price ?? base.averageCost;
  const full = calculateFullHolding(base, latestPrice);

  const formattedTransactions = transactions.map((tx) => ({
    ...tx,
    account:
      tx.investmentAccountId && typeof tx.investmentAccountId === "object"
        ? tx.investmentAccountId
        : undefined,
    investmentAccountId:
      tx.investmentAccountId && typeof tx.investmentAccountId === "object"
        ? (tx.investmentAccountId as { _id: string })._id
        : tx.investmentAccountId,
  }));

  return JSON.parse(
    JSON.stringify({
      asset,
      holding: full,
      transactions: formattedTransactions,
      priceHistory: priceHistory.reverse(),
      lastPriceUpdate: priceHistory.length > 0 ? priceHistory[0].priceDate : null,
    })
  );
}

// ── Portfolio Reports Data ──

export async function getPortfolioHistory(days: number = 30) {
  const userId = await requireUser();
  await connectDB();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshots = await HoldingSnapshot.find({
    userId,
    snapshotDate: { $gte: since },
  })
    .sort({ snapshotDate: 1 })
    .lean();

  // Group by date
  const byDate = new Map<string, { date: string; totalValue: number; totalCost: number }>();

  for (const snap of snapshots) {
    const dateKey = new Date(snap.snapshotDate).toISOString().split("T")[0];
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { date: dateKey, totalValue: 0, totalCost: 0 });
    }
    const entry = byDate.get(dateKey)!;
    entry.totalValue += snap.currentValue;
    entry.totalCost += snap.costBasis;
  }

  return JSON.parse(JSON.stringify([...byDate.values()]));
}

// ── Sync Prices ──

const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const lastSyncByUser = new Map<string, number>();

export async function syncPrices(): Promise<{
  success: boolean;
  error?: string;
  updated?: number;
  cooldownRemaining?: number;
}> {
  const userId = await requireUser();

  // Enforce per-user cooldown
  const lastSync = lastSyncByUser.get(userId) ?? 0;
  const elapsed = Date.now() - lastSync;
  if (elapsed < SYNC_COOLDOWN_MS) {
    const remaining = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
    return { success: false, error: "cooldown", cooldownRemaining: remaining };
  }

  await connectDB();

  // Find user's active assets
  const userAssetIds = await InvestmentTransaction.distinct("assetId", {
    userId,
    assetId: { $ne: null },
  });

  const assets = await InvestmentAsset.find({
    _id: { $in: userAssetIds },
  }).lean();

  if (assets.length === 0) {
    return { success: true, updated: 0 };
  }

  const provider = new YahooFinanceProvider();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let updated = 0;
  for (const asset of assets) {
    try {
      const quote = await provider.getQuote(asset.symbol);
      await PriceSnapshot.findOneAndUpdate(
        { assetId: String(asset._id), priceDate: today, source: "yahoo" },
        {
          $set: {
            symbol: asset.symbol,
            price: quote.price,
            currency: asset.currency,
            rawResponseJson: quote.raw,
          },
        },
        { upsert: true }
      );
      updated++;
    } catch {
      // skip failed symbols
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  // Recalculate holdings for this user
  const holdings = await InvestmentTransaction.aggregate([
    { $match: { userId, assetId: { $ne: null } } },
    {
      $group: {
        _id: { accountId: "$investmentAccountId", assetId: "$assetId" },
      },
    },
  ]);

  for (const doc of holdings) {
    const { accountId, assetId } = doc._id;
    try {
      const txs = await InvestmentTransaction.find({
        userId,
        investmentAccountId: accountId,
        assetId,
      })
        .sort({ transactionDate: 1, createdAt: 1 })
        .lean();

      const base = calculateHoldingFromTransactions(txs);
      const latestSnapshot = await PriceSnapshot.findOne({ assetId })
        .sort({ priceDate: -1 })
        .lean();
      const latestPrice = latestSnapshot?.price ?? base.averageCost;
      const full = calculateFullHolding(base, latestPrice);

      await HoldingSnapshot.findOneAndUpdate(
        { userId, investmentAccountId: accountId, assetId, snapshotDate: today },
        {
          $set: {
            quantity: full.quantity,
            averageCost: full.averageCost,
            costBasis: full.costBasis,
            latestPrice: full.latestPrice,
            currentValue: full.currentValue,
            unrealizedGainLoss: full.unrealizedGainLoss,
            realizedGainLoss: full.realizedGainLoss,
            dividendsReceived: full.dividendsReceived,
            standaloneFees: full.standaloneFees,
            totalReturn: full.totalReturn,
            totalReturnPercentage: full.totalReturnPercentage,
            allocationPercentage: 0,
          },
        },
        { upsert: true }
      );
    } catch {
      // skip failed holdings
    }
  }

  lastSyncByUser.set(userId, Date.now());
  revalidatePath("/investments");

  return { success: true, updated };
}

// ── Chart Data (live from Yahoo Finance) ──

export async function getSymbolHistory(symbol: string) {
  const provider = new YahooFinanceProvider();
  const candles = await provider.getHistoricalPrices(symbol, "1y");
  return candles.map((c) => ({ date: c.date, value: c.close }));
}

export async function getPortfolioChartData() {
  const userId = await requireUser();
  await connectDB();

  // Get user's holdings with their symbols
  const userAssetIds = await InvestmentTransaction.distinct("assetId", {
    userId,
    assetId: { $ne: null },
  });

  const assets = await InvestmentAsset.find({
    _id: { $in: userAssetIds },
  }).lean();

  if (assets.length === 0) return [];

  // Get all transactions to compute holdings at each date
  const txs = await InvestmentTransaction.find({ userId, assetId: { $ne: null } })
    .sort({ transactionDate: 1 })
    .lean();

  // Fetch historical prices for each symbol from Yahoo
  const provider = new YahooFinanceProvider();
  const pricesBySymbol = new Map<string, Map<string, number>>();

  for (const asset of assets) {
    try {
      const candles = await provider.getHistoricalPrices(asset.symbol, "1y");
      const map = new Map<string, number>();
      for (const c of candles) map.set(c.date, c.close);
      pricesBySymbol.set(String(asset._id), map);
    } catch {
      // skip
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  // Collect all trading dates
  const allDates = new Set<string>();
  for (const [, prices] of pricesBySymbol) {
    for (const date of prices.keys()) allDates.add(date);
  }
  const sortedDates = [...allDates].sort();

  const firstTxDate = new Date(txs[0].transactionDate)
    .toISOString()
    .split("T")[0];
  const relevantDates = sortedDates.filter((d) => d >= firstTxDate);

  // For each trading day, compute portfolio value and cost basis
  const chart: { date: string; value: number; cost: number }[] = [];

  for (const dateStr of relevantDates) {
    // Transactions up to this date
    const holdingsMap = new Map<
      string,
      { quantity: number; totalCost: number }
    >();

    for (const tx of txs) {
      const txDate = new Date(tx.transactionDate).toISOString().split("T")[0];
      if (txDate > dateStr) break;
      if (!tx.assetId) continue;

      const key = String(tx.assetId);
      if (!holdingsMap.has(key)) {
        holdingsMap.set(key, { quantity: 0, totalCost: 0 });
      }
      const h = holdingsMap.get(key)!;

      if (tx.type === "buy") {
        h.quantity += tx.quantity ?? 0;
        h.totalCost += tx.totalAmount ?? 0;
      } else if (tx.type === "sell") {
        const avg = h.quantity > 0 ? h.totalCost / h.quantity : 0;
        const qty = tx.quantity ?? 0;
        h.quantity -= qty;
        h.totalCost -= avg * qty;
      }
    }

    let totalValue = 0;
    let totalCost = 0;

    for (const [assetId, h] of holdingsMap) {
      if (h.quantity <= 0) continue;
      totalCost += h.totalCost;

      const prices = pricesBySymbol.get(assetId);
      if (!prices) continue;

      // Find closest price on or before this date
      let price: number | null = null;
      const d = new Date(dateStr);
      for (let i = 0; i <= 5; i++) {
        const check = new Date(d);
        check.setDate(check.getDate() - i);
        const checkStr = check.toISOString().split("T")[0];
        if (prices.has(checkStr)) {
          price = prices.get(checkStr)!;
          break;
        }
      }

      totalValue += h.quantity * (price ?? h.totalCost / h.quantity);
    }

    if (totalCost > 0) {
      chart.push({ date: dateStr, value: totalValue, cost: totalCost });
    }
  }

  return chart;
}

// ── Watchlist ──

export async function getWatchlist() {
  const userId = await requireUser();
  await connectDB();

  const items = await WatchlistItem.find({ userId })
    .sort({ addedAt: -1 })
    .lean();

  if (items.length === 0) return [];

  // Fetch live quotes for all watchlist symbols
  const provider = new YahooFinanceProvider();
  const symbols = items.map((i) => i.symbol);
  const quotes = await provider.getBatchQuotes(symbols);
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  return items.map((item) => {
    const quote = quoteMap.get(item.symbol);
    return {
      _id: String(item._id),
      symbol: item.symbol,
      name: item.name,
      assetType: item.assetType,
      price: quote?.price ?? null,
      addedAt: item.addedAt.toISOString(),
    };
  });
}

export async function addToWatchlist(data: {
  symbol: string;
  name: string;
  assetType: "stock" | "etf";
}) {
  const userId = await requireUser();
  await connectDB();

  await WatchlistItem.findOneAndUpdate(
    { userId, symbol: data.symbol },
    { $setOnInsert: { name: data.name, assetType: data.assetType, addedAt: new Date() } },
    { upsert: true }
  );

  revalidatePath("/investments");
}

export async function removeFromWatchlist(symbol: string) {
  const userId = await requireUser();
  await connectDB();

  await WatchlistItem.deleteOne({ userId, symbol });
  revalidatePath("/investments");
}

export async function isInWatchlist(symbol: string): Promise<boolean> {
  const userId = await requireUser();
  await connectDB();
  const item = await WatchlistItem.findOne({ userId, symbol }).lean();
  return !!item;
}

export async function getSymbolNews(symbol: string) {
  const provider = new YahooFinanceProvider();
  return provider.getNews(symbol, 10);
}

export async function searchSymbolsWithQuotes(query: string) {
  if (!query || query.length < 1) return [];

  const provider = new YahooFinanceProvider();
  const results = await provider.searchSymbol(query);

  // Fetch live prices for search results
  const symbols = results.map((r) => r.symbol);
  const quotes = await provider.getBatchQuotes(symbols);
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  return results.map((r) => ({
    symbol: r.symbol,
    name: r.description,
    type: r.type,
    price: quoteMap.get(r.symbol)?.price ?? null,
  }));
}
