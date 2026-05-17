import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInvestmentAccount extends Document {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  type: "brokerage" | "manual" | "retirement" | "other";
  currency: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentAccountSchema = new Schema<IInvestmentAccount>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["brokerage", "manual", "retirement", "other"],
      default: "brokerage",
    },
    currency: { type: String, required: true, default: "USD" },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const InvestmentAccount =
  mongoose.models.InvestmentAccount ||
  mongoose.model<IInvestmentAccount>("InvestmentAccount", InvestmentAccountSchema);
