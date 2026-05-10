import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICategoryTransfer extends Document {
  _id: Types.ObjectId;
  userId: string;
  budgetPeriodId: Types.ObjectId;
  fromCategoryId: Types.ObjectId;
  toCategoryId: Types.ObjectId;
  amount: number;
  note: string;
  createdAt: Date;
}

const CategoryTransferSchema = new Schema<ICategoryTransfer>(
  {
    userId: { type: String, required: true, index: true },
    budgetPeriodId: {
      type: Schema.Types.ObjectId,
      ref: "BudgetPeriod",
      required: true,
    },
    fromCategoryId: { type: Schema.Types.ObjectId, required: true },
    toCategoryId: { type: Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

CategoryTransferSchema.index({ budgetPeriodId: 1 });

export const CategoryTransfer =
  mongoose.models.CategoryTransfer ||
  mongoose.model<ICategoryTransfer>(
    "CategoryTransfer",
    CategoryTransferSchema
  );
