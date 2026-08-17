import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    // Kept server-side only — never sent to other users
    email: {
      type: String,
      required: true,
      unique: true,
    },
    // The only identity other users ever see
    anonymousUsername: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "chatting", "offline"],
      default: "offline",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    activeConversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast lookups
userSchema.index({ status: 1 });
userSchema.index({ isOnline: 1 });

const User = mongoose.model("User", userSchema);
export default User;