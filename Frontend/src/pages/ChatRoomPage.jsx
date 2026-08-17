import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useWallpaper } from "../context/wallpaper";
import { MessageBubble } from "../components/chat/MessageBubble";
import { EndConversationModal } from "../components/chat/EndConversationModal";
import { Button, TextArea } from "@heroui/react";
import {
  PhoneOffIcon,
  SendHorizontalIcon,
  ImageIcon,
  LoaderIcon,
  WifiOffIcon,
} from "lucide-react";
import useScrollToBottom from "../hooks/useScrollToBottom";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { formatMessageTime } from "../lib/utils";
import { ThemeToggle } from "../components/ThemeToggle";

const TYPING_STOP_DELAY = 1500; // ms after last keystroke to emit stop-typing

function ChatRoomPage() {
  const navigate = useNavigate();
  const { frameStyle } = useWallpaper();

  const authUser = useAuthStore((s) => s.authUser);

  const activeConversation = useChatStore((s) => s.activeConversation);
  const messages = useChatStore((s) => s.messages);
  const isMessagesLoading = useChatStore((s) => s.isMessagesLoading);
  const isSendingMessage = useChatStore((s) => s.isSendingMessage);
  const isSendingMedia = useChatStore((s) => s.isSendingMedia);
  const isPartnerTyping = useChatStore((s) => s.isPartnerTyping);
  const isPartnerDisconnected = useChatStore((s) => s.isPartnerDisconnected);
  const composerText = useChatStore((s) => s.composerText);
  const isSoundEnabled = useChatStore((s) => s.isSoundEnabled);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendMediaMessage = useChatStore((s) => s.sendMediaMessage);
  const endConversation = useChatStore((s) => s.endConversation);
  const setComposerText = useChatStore((s) => s.setComposerText);
  const emitTyping = useChatStore((s) => s.emitTyping);
  const emitStopTyping = useChatStore((s) => s.emitStopTyping);
  const setSoundEnabled = useChatStore((s) => s.setSoundEnabled);
  const clearConversationState = useChatStore((s) => s.clearConversationState);

  const [showEndModal, setShowEndModal] = useState(false);

  const mediaInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const { playRandomKeyStrokeSound } = useKeyboardSound();

  const lastMessageId = messages[messages.length - 1]?._id;
  const scrollRef = useScrollToBottom(activeConversation?.conversationId, lastMessageId);

  // Redirect to lobby if no active conversation
  useEffect(() => {
    if (!activeConversation) {
      navigate("/", { replace: true });
    }
  }, [activeConversation, navigate]);

  // Load message history on mount
  useEffect(() => {
    if (activeConversation?.conversationId) {
      fetchMessages(activeConversation.conversationId);
    }
  }, [activeConversation?.conversationId, fetchMessages]);

  const handleTextChange = (e) => {
    setComposerText(e.target.value);
    if (isSoundEnabled) playRandomKeyStrokeSound();

    // Typing indicator logic
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping();
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitStopTyping();
    }, TYPING_STOP_DELAY);
  };

  const handleSend = useCallback(async () => {
    const text = composerText.trim();
    if (!text) return;

    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    emitStopTyping();

    const ok = await sendMessage(text);
    if (ok && isSoundEnabled) playRandomKeyStrokeSound();
  }, [composerText, sendMessage, emitStopTyping, isSoundEnabled, playRandomKeyStrokeSound]);

  const handleMediaPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ok = await sendMediaMessage(file);
    if (ok && isSoundEnabled) playRandomKeyStrokeSound();
  };

  const handleEndConfirm = async () => {
    setShowEndModal(false);
    await endConversation();
    clearConversationState();
    navigate("/ended", { replace: true });
  };

  const myId = authUser?._id;

  if (!activeConversation) return null;

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden p-2 sm:p-3 md:p-8"
      style={frameStyle}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
        {/* Chat Header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-2.5">
          <div className="flex flex-1 items-center gap-2.5">
            {/* Anonymous avatar placeholder */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
              ?
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight">
                {activeConversation.partnerUsername}
              </p>
              <p className="text-xs">
                {isPartnerDisconnected ? (
                  <span className="flex items-center gap-1 text-warning">
                    <WifiOffIcon className="size-3" /> Disconnected
                  </span>
                ) : isPartnerTyping ? (
                  <span className="text-accent font-medium">typing…</span>
                ) : (
                  <span className="text-success font-medium">Online</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-danger hover:bg-danger/10"
              onPress={() => setShowEndModal(true)}
              aria-label="End conversation"
            >
              <PhoneOffIcon className="size-4" strokeWidth={2} />
              End
            </Button>
          </div>
        </header>

        {/* Conversation context banner */}
        <div className="shrink-0 bg-accent/5 px-4 py-2 text-center text-[11px] text-muted border-b border-border">
          You are chatting anonymously. Neither of you knows the other's identity.
        </div>

        {/* Message list */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {isMessagesLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <LoaderIcon className="size-6 animate-spin text-muted" />
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-4"
            >
              {messages.length === 0 && (
                <p className="mt-4 text-center text-xs text-muted">
                  Say hello! This conversation will be permanently deleted when you end it.
                </p>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={String(msg._id)}
                  message={{
                    id: msg._id,
                    role: String(msg.senderId) === String(myId) ? "me" : "them",
                    text: msg.text || "",
                    time: formatMessageTime(msg.createdAt),
                    imageUrl: msg.image,
                    videoUrl: msg.video,
                  }}
                />
              ))}
              {isPartnerTyping && (
                <div className="flex items-end gap-2">
                  <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-surface px-3 py-2">
                    <div className="flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Partner disconnected banner */}
        {isPartnerDisconnected && (
          <div className="shrink-0 border-t border-border bg-warning/10 px-4 py-2 text-center text-xs text-warning">
            Your anonymous partner disconnected. They may reconnect shortly.
            <button
              className="ml-2 underline"
              onClick={() => { setShowEndModal(true); }}
            >
              End conversation
            </button>
          </div>
        )}

        {/* Composer */}
        {!isPartnerDisconnected && (
          <footer className="shrink-0 border-t border-border px-2 pb-3 pt-2">
            {isSendingMedia && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
                <LoaderIcon className="size-4 shrink-0 animate-spin text-accent" />
                <span>Uploading media…</span>
              </div>
            )}
            <div className="flex items-end gap-1.5 px-1">
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                disabled={isSendingMedia || isSendingMessage}
                tabIndex={-1}
                aria-hidden
                onChange={handleMediaPick}
              />
              <Button
                variant="ghost"
                isIconOnly
                isDisabled={isSendingMedia || isSendingMessage}
                className="size-9 shrink-0 self-end text-accent"
                onPress={() => mediaInputRef.current?.click()}
                aria-label="Attach media"
              >
                <ImageIcon className="size-5" strokeWidth={2} />
              </Button>

              <TextArea
                fullWidth
                variant="secondary"
                placeholder="Type a message…"
                rows={1}
                value={composerText}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 rounded-full"
              />

              <Button
                variant="primary"
                isIconOnly
                isDisabled={!composerText.trim() || isSendingMessage}
                isLoading={isSendingMessage}
                onPress={handleSend}
                aria-label="Send"
              >
                <SendHorizontalIcon className="size-5" />
              </Button>
            </div>
          </footer>
        )}
      </div>

      {/* End conversation modal */}
      {showEndModal && (
        <EndConversationModal
          partnerUsername={activeConversation.partnerUsername}
          onCancel={() => setShowEndModal(false)}
          onConfirm={handleEndConfirm}
        />
      )}
    </div>
  );
}

export default ChatRoomPage;
