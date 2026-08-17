import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";


export const useChatStore = create(
  persist(
    (set, get) => ({
      // ── Lobby state
      availableUsers: [],           // [{ userId, anonymousUsername }]
      isAvailableUsersLoading: false,

      // ── Request state
      incomingRequest: null,        // { requestId, fromUsername, fromUserId }
      outgoingRequest: null,        // { requestId, toUsername }

      // ── Active conversation state
      activeConversation: null,     // { conversationId, partnerUsername }
      messages: [],                 // sanitized message objects
      isMessagesLoading: false,
      isSendingMessage: false,
      isSendingMedia: false,

      // ── UI state
      composerText: "",
      isPartnerTyping: false,
      isPartnerDisconnected: false,
      isSoundEnabled: true,

      // ─── Lobby ──────────────────────────────────────────────────────────

      fetchAvailableUsers: async () => {
        set({ isAvailableUsersLoading: true });
        try {
          const res = await axiosInstance.get("/users/available");
          set({ availableUsers: res.data });
        } catch (err) {
          console.error("[Chat] fetchAvailableUsers:", err.message);
        } finally {
          set({ isAvailableUsersLoading: false });
        }
      },

      sendChatRequest: (receiverId) => {
        // Use socket event for instant communication — no HTTP round-trip
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) {
          toast.error("Not connected. Please refresh.");
          return;
        }
        socket.emit("chat:request", { receiverId });
        // outgoingRequest state is set when server emits chat:request-sent back
      },

      cancelOutgoingRequest: () => {
        // Locally clear — the request will expire server-side via TTL
        set({ outgoingRequest: null });
      },

      acceptRequest: (requestId) => {
        // Use socket event — server handles DB + room join + notifies both parties instantly
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) {
          toast.error("Not connected. Please refresh.");
          return;
        }
        set({ incomingRequest: null });
        socket.emit("chat:accept", { requestId });
        // chat:started socket event will set activeConversation
      },

      rejectRequest: (requestId) => {
        // Use socket event for instant rejection notification to sender
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) {
          toast.error("Not connected. Please refresh.");
          return;
        }
        set({ incomingRequest: null });
        socket.emit("chat:reject", { requestId });
      },

      // ─── Conversation ────────────────────────────────────────────────────

      fetchMessages: async (conversationId) => {
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/conversations/${conversationId}/messages`);
          set({ messages: res.data });
        } catch (err) {
          console.error("[Chat] fetchMessages:", err.message);
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      sendMessage: async (text) => {
        const { activeConversation } = get();
        if (!activeConversation) return false;

        set({ isSendingMessage: true });
        try {
          await axiosInstance.post(
            `/conversations/${activeConversation.conversationId}/messages`,
            { text }
          );
          set({ composerText: "" });
          return true;
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to send message");
          return false;
        } finally {
          set({ isSendingMessage: false });
        }
      },

      sendMediaMessage: async (file) => {
        const { activeConversation } = get();
        if (!activeConversation || !file) return false;

        const formData = new FormData();
        formData.append("media", file);

        set({ isSendingMedia: true });
        try {
          await axiosInstance.post(
            `/conversations/${activeConversation.conversationId}/messages`,
            formData
          );
          return true;
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to upload media");
          return false;
        } finally {
          set({ isSendingMedia: false });
        }
      },

      endConversation: async () => {
        const { activeConversation } = get();
        if (!activeConversation) return;

        try {
          await axiosInstance.post(
            `/conversations/${activeConversation.conversationId}/end`
          );
          // chat:ended socket event will clear state
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to end conversation");
        }
      },

      // ─── Socket event handlers (called from useAuthStore socket listeners) ──

      setAvailableUsers: (users) => set({ availableUsers: users }),

      setIncomingRequest: (data) => set({ incomingRequest: data }),

      setOutgoingRequest: (data) => set({ outgoingRequest: data }),

      handleRequestRejected: ({ fromUsername }) => {
        set({ outgoingRequest: null });
        toast(`${fromUsername} declined the chat request.`, { icon: "👋" });
      },

      handleChatStarted: ({ conversationId, partnerUsername }) => {
        set({
          activeConversation: { conversationId, partnerUsername },
          incomingRequest: null,
          outgoingRequest: null,
          messages: [],
          isPartnerDisconnected: false,
          isPartnerTyping: false,
        });
      },

      handleChatEnded: () => {
        get().clearConversationState();
      },

      // myId is passed in from useAuthStore to avoid circular import
      handleIncomingMessage: (message, myId) => {
        const { activeConversation } = get();
        if (!activeConversation) return;

        const role = String(message.senderId) === String(myId) ? "me" : "them";

        set((state) => ({
          messages: [
            ...state.messages,
            { ...message, role },
          ],
        }));
      },

      setPartnerTyping: (isTyping) => set({ isPartnerTyping: isTyping }),

      setPartnerDisconnected: (val) => set({ isPartnerDisconnected: val }),

      setComposerText: (composerText) => set({ composerText }),
      setSoundEnabled: (isSoundEnabled) => set({ isSoundEnabled }),

      // ─── Typing indicators ────────────────────────────────────────────────

      emitTyping: () => {
        const socket = useAuthStore.getState().socket;
        const { activeConversation } = get();
        if (socket && activeConversation) {
          socket.emit("chat:typing", { conversationId: activeConversation.conversationId });
        }
      },

      emitStopTyping: () => {
        const socket = useAuthStore.getState().socket;
        const { activeConversation } = get();
        if (socket && activeConversation) {
          socket.emit("chat:stop-typing", { conversationId: activeConversation.conversationId });
        }
      },

      // ─── Cleanup ──────────────────────────────────────────────────────────

      clearConversationState: () => {
        set({
          activeConversation: null,
          messages: [],
          composerText: "",
          isPartnerTyping: false,
          isPartnerDisconnected: false,
          isSendingMessage: false,
          isSendingMedia: false,
        });
      },
    }),
    {
      name: "anon-chat-prefs",
      // Only persist sound preference — never persist conversation data
      partialize: (state) => ({ isSoundEnabled: state.isSoundEnabled }),
    }
  )
);