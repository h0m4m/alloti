import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPriceSnapshot extends Document {
  _id: Types.ObjectId;
  assetId: Types.ObjectId;
  symbol: string;
  price: number;
  currency: string;
  source: "finnhub" | "yahoo" | "manual";
  priceDate: Date;
  rawResponseJson: unknown;
  createdAt: Date;
}

const PriceSnapshotSchema = new Schema<IPriceSnapshot>(
  {
    assetId: {
      type: Schema.Types.ObjectId,
      ref: "InvestmentAsset",
      required: true,
    },
    symbol: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true, default: "USD" },
    source: {
      type: String,
      enum: ["finnhub", "yahoo", "manual"],
      required: true,
    },
    priceDate: { type: Date, required: true },
    rawResponseJson: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PriceSnapshotSchema.index(
  { assetId: 1, priceDate: 1, source: 1 },
  { unique: true }
);
PriceSnapshotSchema.index({ symbol: 1, priceDate: -1 });

export const PriceSnapshot =
  mongoose.models.PriceSnapshot ||
  mongoose.model<IPriceSnapshot>("PriceSnapshot", PriceSnapshotSchema);
