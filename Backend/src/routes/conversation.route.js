import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  getMessages,
  sendMessage,
  endConversation,
} from "../controllers/conversation.controller.js";

const router = express.Router();
router.use(protectRoute);

// Get messages for an active conversation (caller must be participant)
router.get("/:id/messages", getMessages);

// Send a message — rate limited to 60 per minute per user
router.post(
  "/:id/messages",
  rateLimit({ windowMs: 60_000, max: 60 }),
  upload.single("media"),
  sendMessage
);

// End (and permanently delete) a conversation
router.post("/:id/end", endConversation);

export default router;
