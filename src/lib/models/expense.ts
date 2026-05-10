import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExpense extends Document {
  _id: Types.ObjectId;
  budgetPeriodId: Types.ObjectId;
  categoryId: Types.ObjectId;
  description: string;
  amount: number;
  date: Date;
  hasAttachment: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    budgetPeriodId: {
      type: Schema.Types.ObjectId,
      ref: "BudgetPeriod",
      required: true,
    },
    categoryId: { type: Schema.Types.ObjectId, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    hasAttachment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ExpenseSchema.index({ budgetPeriodId: 1, categoryId: 1 });
ExpenseSchema.index({ date: -1 });

export const Expense =
  mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);
