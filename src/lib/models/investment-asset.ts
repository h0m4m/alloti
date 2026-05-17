import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInvestmentAsset extends Document {
  _id: Types.ObjectId;
  symbol: string;
  name: string;
  assetType: "stock" | "etf" | "mutual_fund" | "other";
  exchange: string | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentAssetSchema = new Schema<IInvestmentAsset>(
  {
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    assetType: {
      type: String,
      enum: ["stock", "etf", "mutual_fund", "other"],
      required: true,
    },
    exchange: { type: String, default: null },
    currency: { type: String, required: true, default: "USD" },
  },
  { timestamps: true }
);

InvestmentAssetSchema.index({ symbol: 1 }, { unique: true });

export const InvestmentAsset =
  mongoose.models.InvestmentAsset ||
  mongoose.model<IInvestmentAsset>("InvestmentAsset", InvestmentAssetSchema);
