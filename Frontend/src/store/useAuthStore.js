import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

// Forward refs to useChatStore — resolved lazily to avoid circular import at module load time
let _getChatStore = null;
export function setChatStoreRef(getState) {
  _getChatStore = getState;
}

export const useAuthStore = create((set, get) => ({
  authUser: null,       // { _id, anonymousUsername, status, isOnline }
  isCheckingAuth: true,
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket(res.data);
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  clearAuth: () => {
    get().disconnectSocket();
    set({ authUser: null, isCheckingAuth: false });
  },

  connectSocket: (user) => {
    if (!user || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: { userId: user._id },
      reconnection: true,
      reconnectionDelay: 1000,
    });

    set({ socket });

    socket.on("users:available", (users) => {
      _getChatStore?.().setAvailableUsers(users);
    });

    socket.on("chat:request-received", (data) => {
      _getChatStore?.().setIncomingRequest(data);
    });

    socket.on("chat:request-sent", (data) => {
      _getChatStore?.().setOutgoingRequest(data);
    });

    socket.on("chat:request-rejected", (data) => {
      _getChatStore?.().handleRequestRejected(data);
    });

    socket.on("chat:started", (data) => {
      _getChatStore?.().handleChatStarted(data);
    });

    socket.on("chat:ended", () => {
      _getChatStore?.().handleChatEnded();
    });

    socket.on("chat:partner-disconnected", () => {
      _getChatStore?.().setPartnerDisconnected(true);
    });

    socket.on("message:received", (message) => {
      _getChatStore?.().handleIncomingMessage(message, get().authUser?._id);
    });

    socket.on("chat:partner-typing", () => {
      _getChatStore?.().setPartnerTyping(true);
    });

    socket.on("chat:partner-stop-typing", () => {
      _getChatStore?.().setPartnerTyping(false);
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
    set({ socket: null });
  },
}));