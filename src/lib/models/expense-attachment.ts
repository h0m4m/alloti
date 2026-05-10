import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExpenseAttachment extends Document {
  _id: Types.ObjectId;
  userId: string;
  expenseId: Types.ObjectId;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string; // base64 data URL
  createdAt: Date;
}

const ExpenseAttachmentSchema = new Schema<IExpenseAttachment>({
  userId: { type: String, required: true, index: true },
  expenseId: {
    type: Schema.Types.ObjectId,
    ref: "Expense",
    required: true,
    index: true,
  },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  data: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ExpenseAttachment =
  mongoose.models.ExpenseAttachment ||
  mongoose.model<IExpenseAttachment>(
    "ExpenseAttachment",
    ExpenseAttachmentSchema
  );
