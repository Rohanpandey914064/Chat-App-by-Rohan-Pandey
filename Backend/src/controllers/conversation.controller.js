import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { hasImageKitConfig, uploadChatMedia, deleteMedia } from "../lib/imagekit.js";
import { io } from "../lib/socket.js";

/**
 * Verify the requesting user is an active participant of the given conversation.
 * Returns the conversation document or sends an error response.
 */
async function requireParticipant(req, res, checkActive = false) {
  const { id: conversationId } = req.params;
  const userId = req.user._id;

  const query = { _id: conversationId, participants: userId };
  if (checkActive) query.status = "active";

  const conv = await Conversation.findOne(query).lean();
  if (!conv) {
    res.status(403).json({ message: "Conversation not found or access denied" });
    return null;
  }
  return conv;
}

/**
 * GET /api/conversations/:id/messages
 * Fetch all messages in a conversation. Caller must be a participant.
 * Returns only content fields — never sender's real identity.
 */
export async function getMessages(req, res) {
  try {
    const conv = await requireParticipant(req, res);
    if (!conv) return;

    const messages = await Message.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .lean();

    const myId = String(req.user._id);

    const sanitized = messages.map((m) => ({
      _id: m._id,
      role: String(m.senderId) === myId ? "me" : "them",
      text: m.text || "",
      image: m.image || null,
      video: m.video || null,
      messageType: m.messageType,
      createdAt: m.createdAt,
    }));

    res.status(200).json(sanitized);
  } catch (err) {
    console.error("[Conversation] getMessages error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/conversations/:id/messages
 * Send a message to an active conversation. Caller must be a participant.
 */
export async function sendMessage(req, res) {
  try {
    const conv = await requireParticipant(req, res, true); // must be active
    if (!conv) return;

    const senderId = req.user._id;
    const { text } = req.body;

    let imageUrl = null;
    let videoUrl = null;
    let imagekitFileId = null;
    let messageType = "text";

    if (req.file) {
      if (!hasImageKitConfig()) {
        return res.status(500).json({ message: "Media upload is not configured" });
      }
      const { url, fileId } = await uploadChatMedia(req.file);
      imagekitFileId = fileId;

      if (req.file.mimetype.startsWith("video/")) {
        videoUrl = url;
        messageType = "video";
      } else {
        imageUrl = url;
        messageType = "image";
      }
    }

    if (!text && !imageUrl && !videoUrl) {
      return res.status(400).json({ message: "Message must have text or media" });
    }

    const message = await Message.create({
      conversationId: conv._id,
      senderId,
      text: text || "",
      image: imageUrl,
      video: videoUrl,
      imagekitFileId,
      messageType,
    });

    const myId = String(senderId);

    const payload = {
      _id: message._id,
      role: "me",         // will be flipped to "them" for receiver on frontend
      senderId: myId,     // used by receiver to determine "them"
      text: message.text,
      image: message.image,
      video: message.video,
      messageType: message.messageType,
      createdAt: message.createdAt,
    };

    // Broadcast to conversation room (sender's socket also receives it if subscribed)
    io.to(`conversation:${conv._id}`).emit("message:received", payload);

    res.status(201).json({ ...payload, role: "me" });
  } catch (err) {
    console.error("[Conversation] sendMessage error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/conversations/:id/end
 * Permanently end a conversation and delete all messages.
 * Idempotent — safe if called by both users simultaneously.
 */
export async function endConversation(req, res) {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    // Verify participant (any status — even ended is fine for idempotency)
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).lean();

    if (!conv) {
      return res.status(403).json({ message: "Conversation not found or access denied" });
    }

    // Atomic end — only succeeds once
    const ending = await Conversation.findOneAndUpdate(
      { _id: conversationId, status: "active" },
      { $set: { status: "ended", endedAt: new Date() } },
      { new: false }
    );

    if (!ending) {
      // Already ended — return 200 so client can proceed normally
      return res.status(200).json({ message: "Conversation already ended" });
    }

    const participantIds = ending.participants.map(String);

    // Reset users to available
    await User.updateMany(
      { _id: { $in: participantIds } },
      { $set: { status: "available", activeConversationId: null } }
    );

    // Collect media for cleanup
    const messages = await Message.find({ conversationId }).select("imagekitFileId").lean();
    const fileIds = messages.map((m) => m.imagekitFileId).filter(Boolean);

    // Delete messages then conversation
    await Message.deleteMany({ conversationId });
    await Conversation.deleteOne({ _id: conversationId });

    // Notify both participants via socket
    io.to(`conversation:${conversationId}`).emit("chat:ended", { conversationId });

    // Fire-and-forget media cleanup
    for (const fileId of fileIds) {
      deleteMedia(fileId).catch(() => {});
    }

    res.status(200).json({ message: "Conversation ended and permanently deleted" });
  } catch (err) {
    console.error("[Conversation] endConversation error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
