import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBudgetTemplateCategory {
  _id: Types.ObjectId;
  name: string;
  defaultAmount: number;
  defaultPercentage: number | null;
  color: string;
  sortOrder: number;
}

export interface IBudgetTemplate extends Document {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  description: string;
  currency: string;
  categories: IBudgetTemplateCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const BudgetTemplateCategorySchema = new Schema<IBudgetTemplateCategory>({
  name: { type: String, required: true },
  defaultAmount: { type: Number, default: 0 },
  defaultPercentage: { type: Number, default: null },
  color: { type: String, required: true, default: "#6366f1" },
  sortOrder: { type: Number, default: 0 },
});

const BudgetTemplateSchema = new Schema<IBudgetTemplate>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    currency: { type: String, default: "USD" },
    categories: [BudgetTemplateCategorySchema],
  },
  { timestamps: true }
);

export const BudgetTemplate =
  mongoose.models.BudgetTemplate ||
  mongoose.model<IBudgetTemplate>("BudgetTemplate", BudgetTemplateSchema);
