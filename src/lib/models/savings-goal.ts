import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISavingsGoal extends Document {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: Date | null;
  status: "not_started" | "in_progress" | "completed" | "paused";
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    targetDate: { type: Date, default: null },
    status: {
      type: String,
      default: "not_started",
      enum: ["not_started", "in_progress", "completed", "paused"],
    },
  },
  { timestamps: true }
);

export const SavingsGoal =
  mongoose.models.SavingsGoal ||
  mongoose.model<ISavingsGoal>("SavingsGoal", SavingsGoalSchema);
