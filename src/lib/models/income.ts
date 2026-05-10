import mongoose, { Schema, Document, Types } from "mongoose";

export interface IIncome extends Document {
  _id: Types.ObjectId;
  userId: string;
  budgetPeriodId: Types.ObjectId | null;
  amount: number;
  currency: string;
  date: Date;
  source: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    userId: { type: String, required: true, index: true },
    budgetPeriodId: {
      type: Schema.Types.ObjectId,
      ref: "BudgetPeriod",
      default: null,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    date: { type: Date, required: true },
    source: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

IncomeSchema.index({ userId: 1, date: -1 });
IncomeSchema.index({ budgetPeriodId: 1 });

export const Income =
  mongoose.models.Income ||
  mongoose.model<IIncome>("Income", IncomeSchema);
