import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInvestmentTransaction extends Document {
  _id: Types.ObjectId;
  userId: string;
  investmentAccountId: Types.ObjectId;
  assetId: Types.ObjectId | null;
  type: "buy" | "sell" | "dividend" | "deposit" | "withdrawal" | "fee" | "split";
  quantity: number | null;
  pricePerUnit: number | null;
  totalAmount: number;
  fees: number;
  currency: string;
  transactionDate: Date;
  note: string | null;
  splitRatioNumerator: number | null;
  splitRatioDenominator: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentTransactionSchema = new Schema<IInvestmentTransaction>(
  {
    userId: { type: String, required: true, index: true },
    investmentAccountId: {
      type: Schema.Types.ObjectId,
      ref: "InvestmentAccount",
      required: true,
    },
    assetId: {
      type: Schema.Types.ObjectId,
      ref: "InvestmentAsset",
      default: null,
    },
    type: {
      type: String,
      enum: ["buy", "sell", "dividend", "deposit", "withdrawal", "fee", "split"],
      required: true,
    },
    quantity: { type: Number, default: null },
    pricePerUnit: { type: Number, default: null },
    totalAmount: { type: Number, required: true },
    fees: { type: Number, default: 0 },
    currency: { type: String, required: true, default: "USD" },
    transactionDate: { type: Date, required: true },
    note: { type: String, default: null },
    splitRatioNumerator: { type: Number, default: null },
    splitRatioDenominator: { type: Number, default: null },
  },
  { timestamps: true }
);

InvestmentTransactionSchema.index({ investmentAccountId: 1, assetId: 1 });
InvestmentTransactionSchema.index({ transactionDate: -1 });
InvestmentTransactionSchema.index({ userId: 1, type: 1 });

export const InvestmentTransaction =
  mongoose.models.InvestmentTransaction ||
  mongoose.model<IInvestmentTransaction>("InvestmentTransaction", InvestmentTransactionSchema);
