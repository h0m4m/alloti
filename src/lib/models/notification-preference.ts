import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotificationPreference extends Document {
  _id: Types.ObjectId;
  userId: string;
  categoryNearLimit: boolean;
  categoryOverBudget: boolean;
  budgetNearEnd: boolean;
  recurringExpenseDue: boolean;
  uncategorizedCleanup: boolean;
  goalProgressReminder: boolean;
  endOfPeriodReview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: { type: String, required: true, unique: true },
    categoryNearLimit: { type: Boolean, default: true },
    categoryOverBudget: { type: Boolean, default: true },
    budgetNearEnd: { type: Boolean, default: true },
    recurringExpenseDue: { type: Boolean, default: true },
    uncategorizedCleanup: { type: Boolean, default: true },
    goalProgressReminder: { type: Boolean, default: true },
    endOfPeriodReview: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model<INotificationPreference>(
    "NotificationPreference",
    NotificationPreferenceSchema
  );
