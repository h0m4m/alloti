import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBudgetCategory {
  _id: Types.ObjectId;
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface IBudgetPeriod extends Document {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  categories: IBudgetCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const BudgetCategorySchema = new Schema<IBudgetCategory>({
  name: { type: String, required: true },
  allocated: { type: Number, required: true, default: 0 },
  spent: { type: Number, required: true, default: 0 },
  color: { type: String, required: true, default: "#6366f1" },
});

const BudgetPeriodSchema = new Schema<IBudgetPeriod>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalBudget: { type: Number, required: true },
    categories: [BudgetCategorySchema],
  },
  { timestamps: true }
);

export const BudgetPeriod =
  mongoose.models.BudgetPeriod ||
  mongoose.model<IBudgetPeriod>("BudgetPeriod", BudgetPeriodSchema);
