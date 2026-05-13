import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExpense extends Document {
  _id: Types.ObjectId;
  userId: string;
  budgetPeriodId: Types.ObjectId | null;
  categoryId: Types.ObjectId | null;
  description: string;
  amount: number;
  currency: string | null;
  date: Date;
  merchant: string | null;
  source: "manual" | "apple_shortcuts_sms";
  rawImportMessage: string | null;
  rawMessageHash: string | null;
  importConfidence: number | null;
  hasAttachment: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: String, index: true },
    budgetPeriodId: {
      type: Schema.Types.ObjectId,
      ref: "BudgetPeriod",
      default: null,
    },
    categoryId: { type: Schema.Types.ObjectId, default: null },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: null },
    date: { type: Date, required: true, default: Date.now },
    merchant: { type: String, default: null },
    source: {
      type: String,
      enum: ["manual", "apple_shortcuts_sms"],
      default: "manual",
    },
    rawImportMessage: { type: String, default: null },
    rawMessageHash: { type: String, default: null },
    importConfidence: { type: Number, default: null },
    hasAttachment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ExpenseSchema.index({ budgetPeriodId: 1, categoryId: 1 });
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ userId: 1, rawMessageHash: 1 });

export const Expense =
  mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);
