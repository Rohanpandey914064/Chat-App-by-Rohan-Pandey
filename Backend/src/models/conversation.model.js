import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Exactly 2 participants — stored as ObjectIds
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: "A conversation must have exactly 2 participants",
      },
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ status: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
