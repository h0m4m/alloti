import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHoldingSnapshot extends Document {
  _id: Types.ObjectId;
  userId: string;
  investmentAccountId: Types.ObjectId;
  assetId: Types.ObjectId;
  quantity: number;
  averageCost: number;
  costBasis: number;
  latestPrice: number;
  currentValue: number;
  unrealizedGainLoss: number;
  realizedGainLoss: number;
  dividendsReceived: number;
  standaloneFees: number;
  totalReturn: number;
  totalReturnPercentage: number;
  allocationPercentage: number;
  snapshotDate: Date;
  createdAt: Date;
}

const HoldingSnapshotSchema = new Schema<IHoldingSnapshot>(
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
      required: true,
    },
    quantity: { type: Number, required: true },
    averageCost: { type: Number, required: true },
    costBasis: { type: Number, required: true },
    latestPrice: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    unrealizedGainLoss: { type: Number, required: true },
    realizedGainLoss: { type: Number, required: true },
    dividendsReceived: { type: Number, required: true },
    standaloneFees: { type: Number, required: true },
    totalReturn: { type: Number, required: true },
    totalReturnPercentage: { type: Number, required: true },
    allocationPercentage: { type: Number, default: 0 },
    snapshotDate: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

HoldingSnapshotSchema.index(
  { userId: 1, investmentAccountId: 1, assetId: 1, snapshotDate: 1 },
  { unique: true }
);
HoldingSnapshotSchema.index({ snapshotDate: -1 });

export const HoldingSnapshot =
  mongoose.models.HoldingSnapshot ||
  mongoose.model<IHoldingSnapshot>("HoldingSnapshot", HoldingSnapshotSchema);
