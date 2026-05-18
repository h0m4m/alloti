import { connectDB } from "@/lib/db";
import { InvestmentAsset } from "@/lib/models/investment-asset";
import { InvestmentTransaction } from "@/lib/models/investment-transaction";
import { PriceSnapshot } from "@/lib/models/price-snapshot";
import { HoldingSnapshot } from "@/lib/models/holding-snapshot";
import { YahooFinanceProvider } from "@/lib/market-data";
import {
  calculateHoldingFromTransactions,
  calculateFullHolding,
} from "@/lib/holdings-calculator";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Step 1: Find all unique active symbols (assets that have at least one transaction)
  const assetsWithTransactions = await InvestmentTransaction.distinct("assetId", {
    assetId: { $ne: null },
  });

  const assets = await InvestmentAsset.find({
    _id: { $in: assetsWithTransactions },
  }).lean();

  // Dedupe by symbol
  const uniqueAssets = new Map<
    string,
    { id: string; symbol: string; currency: string }
  >();
  for (const asset of assets) {
    if (!uniqueAssets.has(asset.symbol)) {
      uniqueAssets.set(asset.symbol, {
        id: String(asset._id),
        symbol: asset.symbol,
        currency: asset.currency,
      });
    }
  }

  // Step 2: Fetch quotes
  const provider = new YahooFinanceProvider();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results: Array<{
    symbol: string;
    status: "success" | "failed";
    error?: string;
  }> = [];

  for (const asset of uniqueAssets.values()) {
    try {
      const quote = await provider.getQuote(asset.symbol);

      // Step 3: Save PriceSnapshot (upsert)
      await PriceSnapshot.findOneAndUpdate(
        {
          assetId: asset.id,
          priceDate: today,
          source: "yahoo",
        },
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

      results.push({ symbol: asset.symbol, status: "success" });
    } catch (error) {
      results.push({
        symbol: asset.symbol,
        status: "failed",
        error: String(error),
      });
    }

    // Rate limiting between calls
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Step 4: Recalculate holding snapshots for all users
  try {
    await recalculateAllHoldingSnapshots(today);
  } catch (error) {
    console.error("Failed to recalculate holding snapshots:", error);
  }

  const succeeded = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return Response.json({
    success: true,
    symbolsAttempted: results.length,
    symbolsSucceeded: succeeded,
    symbolsFailed: failed,
    results,
  });
}

async function recalculateAllHoldingSnapshots(snapshotDate: Date) {
  // Get all unique userId + accountId + assetId combos from transactions
  const pipeline = await InvestmentTransaction.aggregate([
    { $match: { assetId: { $ne: null } } },
    {
      $group: {
        _id: {
          userId: "$userId",
          accountId: "$investmentAccountId",
          assetId: "$assetId",
        },
      },
    },
  ]);

  for (const doc of pipeline) {
    const { userId, accountId, assetId } = doc._id;

    try {
      const transactions = await InvestmentTransaction.find({
        userId,
        investmentAccountId: accountId,
        assetId,
      })
        .sort({ transactionDate: 1, createdAt: 1 })
        .lean();

      const base = calculateHoldingFromTransactions(transactions);

      // Get latest price
      const latestSnapshot = await PriceSnapshot.findOne({ assetId })
        .sort({ priceDate: -1 })
        .lean();

      const latestPrice = latestSnapshot?.price ?? base.averageCost;
      const full = calculateFullHolding(base, latestPrice);

      await HoldingSnapshot.findOneAndUpdate(
        {
          userId,
          investmentAccountId: accountId,
          assetId,
          snapshotDate,
        },
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
    } catch (error) {
      console.error(
        `Failed to recalculate holding for ${userId}/${accountId}/${assetId}:`,
        error
      );
    }
  }
}
