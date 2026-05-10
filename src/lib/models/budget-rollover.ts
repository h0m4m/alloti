import mongoose, { Schema, Document } from "mongoose";

export interface IBudgetRollover extends Document {
  userId: string;
  fromBudgetPeriodId: string;
  toBudgetPeriodId: string | null;
  toGoalId: string | null;
  amount: number;
  action: "rollover_to_budget" | "rollover_to_goal" | "ignored";
  createdAt: Date;
}

const BudgetRolloverSchema = new Schema<IBudgetRollover>(
  {
    userId: { type: String, required: true, index: true },
    fromBudgetPeriodId: { type: String, required: true },
    toBudgetPeriodId: { type: String, default: null },
    toGoalId: { type: String, default: null },
    amount: { type: Number, required: true },
    action: {
      type: String,
      enum: ["rollover_to_budget", "rollover_to_goal", "ignored"],
      required: true,
    },
  },
  { timestamps: true }
);

export const BudgetRollover =
  mongoose.models.BudgetRollover ||
  mongoose.model<IBudgetRollover>("BudgetRollover", BudgetRolloverSchema);
