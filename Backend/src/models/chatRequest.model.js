import mongoose from "mongoose";

const REQUEST_TTL_MINUTES = Number(process.env.CHAT_REQUEST_TTL_MINUTES || 5);

const chatRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
    // MongoDB TTL index will auto-delete this document after expiry
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + REQUEST_TTL_MINUTES * 60 * 1000),
    },
  },
  { timestamps: true }
);

// Auto-delete expired documents via MongoDB TTL index
chatRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent duplicate pending requests between the same pair
chatRequestSchema.index(
  { senderId: 1, receiverId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

const ChatRequest = mongoose.model("ChatRequest", chatRequestSchema);
export default ChatRequest;
