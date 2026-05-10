import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRecurringExpense extends Document {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  categoryName: string;
  frequency:
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "yearly";
  startDate: Date;
  endDate: Date | null;
  nextDueDate: Date;
  status: "active" | "paused";
  createdAt: Date;
  updatedAt: Date;
}

const RecurringExpenseSchema = new Schema<IRecurringExpense>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    categoryName: { type: String, default: "" },
    frequency: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    nextDueDate: { type: Date, required: true },
    status: {
      type: String,
      default: "active",
      enum: ["active", "paused"],
    },
  },
  { timestamps: true }
);

RecurringExpenseSchema.index({ userId: 1, nextDueDate: 1 });

export const RecurringExpense =
  mongoose.models.RecurringExpense ||
  mongoose.model<IRecurringExpense>(
    "RecurringExpense",
    RecurringExpenseSchema
  );
