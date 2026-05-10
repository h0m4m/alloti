import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGoalContribution extends Document {
  _id: Types.ObjectId;
  userId: string;
  goalId: Types.ObjectId;
  sourceBudgetPeriodId: Types.ObjectId | null;
  amount: number;
  date: Date;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalContributionSchema = new Schema<IGoalContribution>(
  {
    userId: { type: String, required: true, index: true },
    goalId: {
      type: Schema.Types.ObjectId,
      ref: "SavingsGoal",
      required: true,
    },
    sourceBudgetPeriodId: {
      type: Schema.Types.ObjectId,
      ref: "BudgetPeriod",
      default: null,
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

GoalContributionSchema.index({ goalId: 1, date: -1 });

export const GoalContribution =
  mongoose.models.GoalContribution ||
  mongoose.model<IGoalContribution>(
    "GoalContribution",
    GoalContributionSchema
  );
