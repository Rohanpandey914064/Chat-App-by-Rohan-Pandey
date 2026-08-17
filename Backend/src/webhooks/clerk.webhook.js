import express from "express";
import User from "../models/user.model.js";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { generateAnonymousUsername } from "../lib/usernameGenerator.js";

const router = express.Router();

const MAX_USERNAME_RETRIES = 5;

router.post("/", async (req, res) => {
  try {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) {
      res.status(503).json({ message: "Webhook secret is not provided" });
      return;
    }

    const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
    const request = new Request("http://internal/webhooks/clerk", {
      method: "POST",
      headers: new Headers(req.headers),
      body: payload,
    });

    const evt = await verifyWebhook(request, { signingSecret });

    if (evt.type === "user.created") {
      const u = evt.data;

      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ??
        u.email_addresses?.[0]?.email_address;

      // Try to generate a unique anonymous username — retry on collision
      let anonymousUsername;
      for (let attempt = 0; attempt < MAX_USERNAME_RETRIES; attempt++) {
        anonymousUsername = generateAnonymousUsername();
        const exists = await User.findOne({ anonymousUsername }).lean();
        if (!exists) break;
        if (attempt === MAX_USERNAME_RETRIES - 1) {
          // Extremely unlikely — append extra randomness
          anonymousUsername += Math.floor(Math.random() * 10);
        }
      }

      await User.findOneAndUpdate(
        { clerkId: u.id },
        {
          clerkId: u.id,
          email,
          anonymousUsername,
          status: "offline",
          isOnline: false,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    if (evt.type === "user.updated") {
      const u = evt.data;
      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ??
        u.email_addresses?.[0]?.email_address;

      // Only update PII we store server-side; never overwrite the anonymous username
      await User.findOneAndUpdate(
        { clerkId: u.id },
        { $set: { email } },
        { new: true }
      );
    }

    if (evt.type === "user.deleted") {
      if (evt.data.id) {
        const user = await User.findOne({ clerkId: evt.data.id }).lean();
        if (user?.activeConversationId) {
          // Notify partner and clean up — import lazily to avoid circular dep
          const { default: Conversation } = await import("../models/conversation.model.js");
          const { default: Message } = await import("../models/message.model.js");
          const { io } = await import("../lib/socket.js");

          await Conversation.findByIdAndUpdate(user.activeConversationId, {
            $set: { status: "ended", endedAt: new Date() },
          });
          await Message.deleteMany({ conversationId: user.activeConversationId });
          await Conversation.deleteOne({ _id: user.activeConversationId });

          io.to(`conversation:${user.activeConversationId}`).emit("chat:ended", {
            conversationId: user.activeConversationId,
          });
        }
        await User.findOneAndDelete({ clerkId: evt.data.id });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error in Clerk webhook:", error);
    res.status(400).json({ message: "Webhook verification failed" });
  }
});

export default router;