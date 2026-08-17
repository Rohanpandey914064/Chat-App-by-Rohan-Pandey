import express from "express";
import http from "http";
import { Server } from "socket.io";
import { getAuth } from "@clerk/express";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import ChatRequest from "../models/chatRequest.model.js";
import { deleteMedia } from "./imagekit.js";

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const DISCONNECT_GRACE_MS = Number(process.env.DISCONNECT_GRACE_PERIOD_MS || 30000);

const io = new Server(server, {
  cors: { origin: [allowedOrigin], credentials: true },
});

// userId (MongoDB _id string) → socketId
const userSocketMap = new Map();

// userId → reconnect grace timeout handle
const reconnectTimers = new Map();

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getSocketId(userId) {
  return userSocketMap.get(String(userId));
}

export { io };

/**
 * Emit the current list of available users to every connected socket.
 * Only broadcasts anonymousUsername — no private data.
 */
async function broadcastAvailableUsers() {
  try {
    const available = await User.find({
      isOnline: true,
      status: "available",
    }).select("_id anonymousUsername").lean();

    io.emit("users:available", available.map((u) => ({
      userId: u._id,
      anonymousUsername: u.anonymousUsername,
    })));
  } catch (err) {
    console.error("[Socket] broadcastAvailableUsers error:", err.message);
  }
}

/**
 * Permanently delete a conversation and all its messages.
 * Cleans up ImageKit media, user statuses, and socket rooms.
 * Safe to call multiple times (idempotent via status check).
 */
async function destroyConversation(conversationId) {
  // Atomic status flip — only first caller proceeds
  const conv = await Conversation.findOneAndUpdate(
    { _id: conversationId, status: "active" },
    { $set: { status: "ended", endedAt: new Date() } },
    { new: false }
  );

  if (!conv) {
    // Already ended — harmless no-op
    return null;
  }

  const participantIds = conv.participants.map(String);

  // Reset both users' statuses
  await User.updateMany(
    { _id: { $in: participantIds } },
    { $set: { status: "available", activeConversationId: null } }
  );

  // Collect media file IDs for cleanup
  const messages = await Message.find({ conversationId }).select("imagekitFileId").lean();
  const fileIds = messages.map((m) => m.imagekitFileId).filter(Boolean);

  // Delete messages from DB
  await Message.deleteMany({ conversationId });

  // Delete conversation document
  await Conversation.deleteOne({ _id: conversationId });

  // Fire-and-forget ImageKit cleanup
  for (const fileId of fileIds) {
    deleteMedia(fileId).catch(() => {}); // already logs internally
  }

  return participantIds;
}

// ─── Socket Connection Handler ───────────────────────────────────────────────

io.on("connection", async (socket) => {
  const rawUserId = socket.handshake.query.userId;
  if (!rawUserId) {
    socket.disconnect(true);
    return;
  }

  const userId = String(rawUserId);

  // Cancel any pending reconnect grace timer
  if (reconnectTimers.has(userId)) {
    clearTimeout(reconnectTimers.get(userId));
    reconnectTimers.delete(userId);
  }

  userSocketMap.set(userId, socket.id);

  // Mark user online + available
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isOnline: true, status: "available" } },
    { new: true }
  ).select("_id anonymousUsername status activeConversationId").lean();

  if (!user) {
    socket.disconnect(true);
    return;
  }

  // If user was mid-conversation before disconnect, rejoin room
  if (user.activeConversationId) {
    const conv = await Conversation.findOne({
      _id: user.activeConversationId,
      status: "active",
    }).lean();
    if (conv) {
      socket.join(`conversation:${conv._id}`);
    } else {
      // Stale — clean up
      await User.findByIdAndUpdate(userId, {
        $set: { status: "available", activeConversationId: null },
      });
    }
  }

  broadcastAvailableUsers();

  // ── chat:request ──────────────────────────────────────────────────────────
  // Client sends: { receiverId }
  socket.on("chat:request", async ({ receiverId } = {}) => {
    try {
      if (!receiverId || String(receiverId) === userId) return;

      const [sender, receiver] = await Promise.all([
        User.findById(userId).lean(),
        User.findById(receiverId).lean(),
      ]);

      if (!sender || !receiver) return;
      if (sender.status !== "available" || !sender.isOnline) return;
      if (receiver.status !== "available" || !receiver.isOnline) return;

      // Create request (unique index prevents duplicates)
      let chatReq;
      try {
        chatReq = await ChatRequest.create({ senderId: userId, receiverId });
      } catch (dupErr) {
        // Already a pending request — silently ignore
        return;
      }

      // Mark sender as pending
      await User.findByIdAndUpdate(userId, { $set: { status: "request_pending" } });

      broadcastAvailableUsers();

      // Notify receiver
      const receiverSocketId = userSocketMap.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("chat:request-received", {
          requestId: chatReq._id,
          fromUsername: sender.anonymousUsername,
          fromUserId: userId,
        });
      }

      // Notify sender of confirmation
      socket.emit("chat:request-sent", {
        requestId: chatReq._id,
        toUsername: receiver.anonymousUsername,
      });
    } catch (err) {
      console.error("[Socket] chat:request error:", err.message);
    }
  });

  // ── chat:accept ───────────────────────────────────────────────────────────
  // Client sends: { requestId }
  socket.on("chat:accept", async ({ requestId } = {}) => {
    try {
      const chatReq = await ChatRequest.findOne({
        _id: requestId,
        receiverId: userId,
        status: "pending",
      });

      if (!chatReq) {
        socket.emit("chat:error", { message: "Request not found or already handled." });
        return;
      }

      const [sender, receiver] = await Promise.all([
        User.findById(chatReq.senderId).lean(),
        User.findById(chatReq.receiverId).lean(),
      ]);

      if (!sender || !receiver) return;
      if (!sender.isOnline || !receiver.isOnline) {
        await ChatRequest.findByIdAndUpdate(requestId, { $set: { status: "expired" } });
        socket.emit("chat:error", { message: "The other user went offline." });
        return;
      }

      // Mark request accepted
      await ChatRequest.findByIdAndUpdate(requestId, { $set: { status: "accepted" } });

      // Create conversation
      const conversation = await Conversation.create({
        participants: [chatReq.senderId, chatReq.receiverId],
        status: "active",
      });

      const convId = conversation._id;

      // Update both users to chatting
      await User.updateMany(
        { _id: { $in: [chatReq.senderId, chatReq.receiverId] } },
        { $set: { status: "chatting", activeConversationId: convId } }
      );

      // Join both sockets to conversation room
      const senderSocketId = userSocketMap.get(String(chatReq.senderId));
      const receiverSocketId = userSocketMap.get(String(chatReq.receiverId));

      if (senderSocketId) io.sockets.sockets.get(senderSocketId)?.join(`conversation:${convId}`);
      if (receiverSocketId) io.sockets.sockets.get(receiverSocketId)?.join(`conversation:${convId}`);

      broadcastAvailableUsers();

      // Notify both
      const payload = (partnerUsername) => ({
        conversationId: convId,
        partnerUsername,
      });

      if (senderSocketId) {
        io.to(senderSocketId).emit("chat:started", payload(receiver.anonymousUsername));
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("chat:started", payload(sender.anonymousUsername));
      }
    } catch (err) {
      console.error("[Socket] chat:accept error:", err.message);
    }
  });

  // ── chat:reject ───────────────────────────────────────────────────────────
  // Client sends: { requestId }
  socket.on("chat:reject", async ({ requestId } = {}) => {
    try {
      const chatReq = await ChatRequest.findOne({
        _id: requestId,
        receiverId: userId,
        status: "pending",
      });

      if (!chatReq) return;

      await ChatRequest.findByIdAndUpdate(requestId, { $set: { status: "rejected" } });

      // Restore sender to available
      await User.findByIdAndUpdate(chatReq.senderId, { $set: { status: "available" } });

      broadcastAvailableUsers();

      const senderSocketId = userSocketMap.get(String(chatReq.senderId));
      if (senderSocketId) {
        const receiver = await User.findById(userId).select("anonymousUsername").lean();
        io.to(senderSocketId).emit("chat:request-rejected", {
          fromUsername: receiver?.anonymousUsername ?? "Someone",
        });
      }
    } catch (err) {
      console.error("[Socket] chat:reject error:", err.message);
    }
  });

  // ── chat:end ──────────────────────────────────────────────────────────────
  // Client sends: { conversationId }
  socket.on("chat:end", async ({ conversationId } = {}) => {
    try {
      if (!conversationId) return;

      // Verify requester is a participant
      const conv = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).lean();

      if (!conv) return;

      const participantIds = await destroyConversation(conversationId);
      if (!participantIds) return; // already ended

      // Notify room (both users)
      io.to(`conversation:${conversationId}`).emit("chat:ended", { conversationId });

      // Remove both users from room
      for (const pid of participantIds) {
        const sid = userSocketMap.get(pid);
        if (sid) io.sockets.sockets.get(sid)?.leave(`conversation:${conversationId}`);
      }

      broadcastAvailableUsers();
    } catch (err) {
      console.error("[Socket] chat:end error:", err.message);
    }
  });

  // ── chat:typing ───────────────────────────────────────────────────────────
  socket.on("chat:typing", ({ conversationId } = {}) => {
    if (!conversationId) return;
    socket.to(`conversation:${conversationId}`).emit("chat:partner-typing");
  });

  // ── chat:stop-typing ──────────────────────────────────────────────────────
  socket.on("chat:stop-typing", ({ conversationId } = {}) => {
    if (!conversationId) return;
    socket.to(`conversation:${conversationId}`).emit("chat:partner-stop-typing");
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    userSocketMap.delete(userId);

    // Grace period: wait before marking offline so brief reconnects are transparent
    const timer = setTimeout(async () => {
      reconnectTimers.delete(userId);

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { isOnline: false, status: "offline" } },
        { new: true }
      ).lean();

      if (!user) return;

      // If user was in a conversation, notify partner
      if (user.activeConversationId) {
        const convId = user.activeConversationId;
        io.to(`conversation:${convId}`).emit("chat:partner-disconnected");
      }

      broadcastAvailableUsers();
    }, DISCONNECT_GRACE_MS);

    reconnectTimers.set(userId, timer);
  });
});

export { app, server };