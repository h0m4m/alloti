import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: unknown[];
}

export interface IChatConversation extends Document {
  _id: Types.ObjectId;
  userId: string;
  title: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    parts: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ChatConversationSchema = new Schema<IChatConversation>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true, default: "New chat" },
    messages: { type: [ChatMessageSchema], default: [] },
  },
  { timestamps: true }
);

ChatConversationSchema.index({ userId: 1, updatedAt: -1 });

export const ChatConversation =
  mongoose.models.ChatConversation ||
  mongoose.model<IChatConversation>(
    "ChatConversation",
    ChatConversationSchema
  );
