import mongoose, { Schema, Document } from "mongoose";

export interface IUserPreferences extends Document {
  userId: string;
  defaultCurrency: string;
  defaultBudgetDuration: number; // days
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  dateFormat: string;
  numberFormat: string;
  defaultTemplateId: string | null;
  defaultRolloverBehavior: "ask" | "rollover" | "ignore";
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    defaultCurrency: { type: String, default: "USD" },
    defaultBudgetDuration: { type: Number, default: 30 },
    firstDayOfWeek: { type: Number, default: 0 },
    dateFormat: { type: String, default: "MMM d, yyyy" },
    numberFormat: { type: String, default: "en-US" },
    defaultTemplateId: { type: String, default: null },
    defaultRolloverBehavior: {
      type: String,
      enum: ["ask", "rollover", "ignore"],
      default: "ask",
    },
  },
  { timestamps: true }
);

export const UserPreferences =
  mongoose.models.UserPreferences ||
  mongoose.model<IUserPreferences>("UserPreferences", UserPreferencesSchema);
