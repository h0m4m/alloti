import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWatchlistItem extends Document {
  _id: Types.ObjectId;
  userId: string;
  symbol: string;
  name: string;
  assetType: "stock" | "etf";
  addedAt: Date;
}

const WatchlistItemSchema = new Schema<IWatchlistItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    assetType: { type: String, enum: ["stock", "etf"], required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

WatchlistItemSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const WatchlistItem =
  mongoose.models.WatchlistItem ||
  mongoose.model<IWatchlistItem>("WatchlistItem", WatchlistItemSchema);
