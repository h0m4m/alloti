"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { InvestmentAccount } from "@/lib/models/investment-account";
import { InvestmentAsset } from "@/lib/models/investment-asset";
import { InvestmentTransaction } from "@/lib/models/investment-transaction";
import { PriceSnapshot } from "@/lib/models/price-snapshot";
import { HoldingSnapshot } from "@/lib/models/holding-snapshot";
import {
  calculateHoldingFromTransactions,
  calculateFullHolding,
} from "@/lib/holdings-calculator";
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
  const { FinnhubMarketDataProvider } = await import("@/lib/market-data");
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  const provider = new FinnhubMarketDataProvider(apiKey);
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

  // Fallback: fetch live from Finnhub
  const asset = await InvestmentAsset.findById(assetId).lean();
  if (!asset) return null;

  const { FinnhubMarketDataProvider } = await import("@/lib/market-data");
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;

  try {
    const provider = new FinnhubMarketDataProvider(apiKey);
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
