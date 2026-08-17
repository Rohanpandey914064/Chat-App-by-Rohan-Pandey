import ChatRequest from "../models/chatRequest.model.js";
import User from "../models/user.model.js";
import { getSocketId, io } from "../lib/socket.js";

/**
 * POST /api/chat-requests
 * Send a chat request to another anonymous user.
 */
export async function sendRequest(req, res) {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId).lean(),
      User.findById(receiverId).lean(),
    ]);

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    if (sender.status !== "available") {
      return res.status(409).json({ message: "You are not available to send requests" });
    }

    if (!receiver.isOnline || receiver.status !== "available") {
      return res.status(409).json({ message: "That user is not available right now" });
    }

    // Create request (unique index prevents duplicate pending)
    let chatReq;
    try {
      chatReq = await ChatRequest.create({ senderId, receiverId });
    } catch (dupErr) {
      return res.status(409).json({ message: "You already have a pending request to this user" });
    }

    // Mark sender as pending
    await User.findByIdAndUpdate(senderId, { $set: { status: "request_pending" } });

    // Emit socket event to receiver if online
    const receiverSocketId = getSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("chat:request-received", {
        requestId: chatReq._id,
        fromUsername: sender.anonymousUsername,
        fromUserId: senderId,
      });
    }

    res.status(201).json({
      requestId: chatReq._id,
      toUsername: receiver.anonymousUsername,
    });
  } catch (err) {
    console.error("[ChatRequest] sendRequest error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/chat-requests/incoming
 * Returns the current user's pending incoming request, if any.
 */
export async function getIncomingRequest(req, res) {
  try {
    const receiverId = req.user._id;

    const chatReq = await ChatRequest.findOne({
      receiverId,
      status: "pending",
    }).populate("senderId", "anonymousUsername").lean();

    if (!chatReq) {
      return res.status(200).json(null);
    }

    res.status(200).json({
      requestId: chatReq._id,
      fromUsername: chatReq.senderId.anonymousUsername,
      fromUserId: chatReq.senderId._id,
    });
  } catch (err) {
    console.error("[ChatRequest] getIncomingRequest error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/chat-requests/:id/accept
 * Accept a pending incoming chat request and create a conversation.
 */
export async function acceptRequest(req, res) {
  try {
    // Import here to avoid circular dependency with socket.js
    const { default: Conversation } = await import("../models/conversation.model.js");
    const receiverId = req.user._id;
    const { id: requestId } = req.params;

    const chatReq = await ChatRequest.findOne({
      _id: requestId,
      receiverId,
      status: "pending",
    });

    if (!chatReq) {
      return res.status(404).json({ message: "Request not found or already handled" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(chatReq.senderId).lean(),
      User.findById(chatReq.receiverId).lean(),
    ]);

    if (!sender?.isOnline) {
      await ChatRequest.findByIdAndUpdate(requestId, { $set: { status: "expired" } });
      await User.findByIdAndUpdate(chatReq.senderId, { $set: { status: "available" } });
      return res.status(409).json({ message: "The sender went offline" });
    }

    await ChatRequest.findByIdAndUpdate(requestId, { $set: { status: "accepted" } });

    const conversation = await Conversation.create({
      participants: [chatReq.senderId, chatReq.receiverId],
      status: "active",
    });

    await User.updateMany(
      { _id: { $in: [chatReq.senderId, chatReq.receiverId] } },
      { $set: { status: "chatting", activeConversationId: conversation._id } }
    );

    // Notify via socket
    const senderSocketId = getSocketId(chatReq.senderId);
    const receiverSocketId = getSocketId(chatReq.receiverId);
    const convId = conversation._id;

    if (senderSocketId) {
      const s = io.sockets.sockets.get(senderSocketId);
      s?.join(`conversation:${convId}`);
      io.to(senderSocketId).emit("chat:started", {
        conversationId: convId,
        partnerUsername: receiver.anonymousUsername,
      });
    }
    if (receiverSocketId) {
      const s = io.sockets.sockets.get(receiverSocketId);
      s?.join(`conversation:${convId}`);
      io.to(receiverSocketId).emit("chat:started", {
        conversationId: convId,
        partnerUsername: sender.anonymousUsername,
      });
    }

    res.status(200).json({
      conversationId: convId,
      partnerUsername: sender.anonymousUsername,
    });
  } catch (err) {
    console.error("[ChatRequest] acceptRequest error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/chat-requests/:id/reject
 * Reject a pending incoming chat request.
 */
export async function rejectRequest(req, res) {
  try {
    const receiverId = req.user._id;
    const { id: requestId } = req.params;

    const chatReq = await ChatRequest.findOne({
      _id: requestId,
      receiverId,
      status: "pending",
    });

    if (!chatReq) {
      return res.status(404).json({ message: "Request not found or already handled" });
    }

    await ChatRequest.findByIdAndUpdate(requestId, { $set: { status: "rejected" } });
    await User.findByIdAndUpdate(chatReq.senderId, { $set: { status: "available" } });

    const receiver = await User.findById(receiverId).select("anonymousUsername").lean();
    const senderSocketId = getSocketId(chatReq.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("chat:request-rejected", {
        fromUsername: receiver?.anonymousUsername ?? "Someone",
      });
    }

    res.status(200).json({ message: "Request rejected" });
  } catch (err) {
    console.error("[ChatRequest] rejectRequest error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
