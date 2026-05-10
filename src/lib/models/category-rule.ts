import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICategoryRule extends Document {
  _id: Types.ObjectId;
  userId: string;
  keyword: string;
  categoryName: string;
  matchType: "contains" | "exact" | "starts_with";
  createdAt: Date;
  updatedAt: Date;
}

const CategoryRuleSchema = new Schema<ICategoryRule>(
  {
    userId: { type: String, required: true, index: true },
    keyword: { type: String, required: true },
    categoryName: { type: String, required: true },
    matchType: {
      type: String,
      required: true,
      enum: ["contains", "exact", "starts_with"],
      default: "contains",
    },
  },
  { timestamps: true }
);

CategoryRuleSchema.index({ userId: 1, keyword: 1 });

export const CategoryRule =
  mongoose.models.CategoryRule ||
  mongoose.model<ICategoryRule>("CategoryRule", CategoryRuleSchema);
