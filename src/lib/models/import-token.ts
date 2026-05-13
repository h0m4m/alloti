import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";

export interface IImportToken extends Document {
  userId: string;
  token: string;
  enabled: boolean;
  lastImportAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ImportTokenSchema = new Schema<IImportToken>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    enabled: { type: Boolean, default: true },
    lastImportAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ImportTokenSchema.index({ token: 1 });

export const ImportToken =
  mongoose.models.ImportToken ||
  mongoose.model<IImportToken>("ImportToken", ImportTokenSchema);
