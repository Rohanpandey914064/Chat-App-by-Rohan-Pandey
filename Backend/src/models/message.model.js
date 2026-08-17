import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
    video: {
      type: String,
      default: null,
    },
    // Stored for cleanup when conversation is permanently deleted
    imagekitFileId: {
      type: String,
      default: null,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },
  },
  { timestamps: true }
);

// Fast bulk-delete and sorted fetch by conversation
messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;