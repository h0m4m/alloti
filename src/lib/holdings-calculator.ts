import type { IInvestmentTransaction } from "@/lib/models/investment-transaction";

export interface HoldingCalculation {
  quantity: number;
  averageCost: number;
  costBasis: number;
  realizedGainLoss: number;
  dividendsReceived: number;
  standaloneFees: number;
}

export interface FullHoldingCalculation extends HoldingCalculation {
  latestPrice: number;
  currentValue: number;
  unrealizedGainLoss: number;
  totalReturn: number;
  totalReturnPercentage: number;
}

export function calculateHoldingFromTransactions(
  transactions: Pick<
    IInvestmentTransaction,
    "type" | "quantity" | "pricePerUnit" | "totalAmount" | "fees" | "splitRatioNumerator" | "splitRatioDenominator"
  >[]
): HoldingCalculation {
  let quantity = 0;
  let costBasis = 0;
  let realizedGainLoss = 0;
  let dividendsReceived = 0;
  let standaloneFees = 0;

  for (const tx of transactions) {
    switch (tx.type) {
      case "buy": {
        const qty = tx.quantity ?? 0;
        const price = tx.pricePerUnit ?? 0;
        const buyCost = qty * price + (tx.fees ?? 0);
        quantity += qty;
        costBasis += buyCost;
        break;
      }

      case "sell": {
        const qty = tx.quantity ?? 0;
        const price = tx.pricePerUnit ?? 0;
        const avgCostBeforeSale = quantity > 0 ? costBasis / quantity : 0;
        const costRemoved = avgCostBeforeSale * qty;
        const sellProceeds = qty * price - (tx.fees ?? 0);
        realizedGainLoss += sellProceeds - costRemoved;
        quantity -= qty;
        costBasis -= costRemoved;
        break;
      }

      case "dividend": {
        dividendsReceived += tx.totalAmount ?? 0;
        break;
      }

      case "fee": {
        standaloneFees += tx.totalAmount ?? 0;
        break;
      }

      case "split": {
        const num = tx.splitRatioNumerator ?? 1;
        const den = tx.splitRatioDenominator ?? 1;
        if (den > 0) {
          quantity = (quantity * num) / den;
        }
        break;
      }

      // deposit/withdrawal don't affect asset holdings
      default:
        break;
    }
  }

  // Prevent floating point dust
  if (Math.abs(quantity) < 0.0000001) {
    quantity = 0;
    costBasis = 0;
  }

  const averageCost = quantity > 0 ? costBasis / quantity : 0;

  return {
    quantity,
    averageCost,
    costBasis,
    realizedGainLoss,
    dividendsReceived,
    standaloneFees,
  };
}

export function calculateFullHolding(
  base: HoldingCalculation,
  latestPrice: number
): FullHoldingCalculation {
  const currentValue = base.quantity * latestPrice;
  const unrealizedGainLoss = base.quantity > 0 ? currentValue - base.costBasis : 0;
  const totalReturn =
    unrealizedGainLoss +
    base.realizedGainLoss +
    base.dividendsReceived -
    base.standaloneFees;
  const totalInvested = base.costBasis + base.realizedGainLoss + base.standaloneFees - base.dividendsReceived;
  const totalReturnPercentage =
    totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  return {
    ...base,
    latestPrice,
    currentValue,
    unrealizedGainLoss,
    totalReturn,
    totalReturnPercentage,
  };
}

export function calculateCashBalance(
  transactions: Pick<
    IInvestmentTransaction,
    "type" | "quantity" | "pricePerUnit" | "totalAmount" | "fees"
  >[]
): number {
  let cash = 0;

  for (const tx of transactions) {
    switch (tx.type) {
      case "deposit":
        cash += tx.totalAmount ?? 0;
        break;
      case "withdrawal":
        cash -= tx.totalAmount ?? 0;
        break;
      case "buy": {
        const qty = tx.quantity ?? 0;
        const price = tx.pricePerUnit ?? 0;
        cash -= qty * price + (tx.fees ?? 0);
        break;
      }
      case "sell": {
        const qty = tx.quantity ?? 0;
        const price = tx.pricePerUnit ?? 0;
        cash += qty * price - (tx.fees ?? 0);
        break;
      }
      case "dividend":
        cash += tx.totalAmount ?? 0;
        break;
      case "fee":
        cash -= tx.totalAmount ?? 0;
        break;
      default:
        break;
    }
  }

  return cash;
}
