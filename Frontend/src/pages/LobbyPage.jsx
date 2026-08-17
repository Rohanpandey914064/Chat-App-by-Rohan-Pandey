import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { UserButton } from "@clerk/react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useWallpaper } from "../context/wallpaper";
import { ThemeToggle } from "../components/ThemeToggle";
import { ThemePresetPicker } from "../components/ThemePresetPicker";
import { WallpaperPicker } from "../components/WallpaperPicker";
import AvailableUserCard from "../components/lobby/AvailableUserCard";
import IncomingRequestModal from "../components/lobby/IncomingRequestModal";
import OutgoingRequestBanner from "../components/lobby/OutgoingRequestBanner";
import { UsersIcon, RefreshCwIcon } from "lucide-react";
import { APP_NAME, AppLogo } from "../components/AppLogo";
import { Button } from "@heroui/react";

function LobbyPage() {
  const navigate = useNavigate();
  const { frameStyle } = useWallpaper();

  const authUser = useAuthStore((s) => s.authUser);

  const availableUsers = useChatStore((s) => s.availableUsers);
  const isAvailableUsersLoading = useChatStore((s) => s.isAvailableUsersLoading);
  const fetchAvailableUsers = useChatStore((s) => s.fetchAvailableUsers);
  const sendChatRequest = useChatStore((s) => s.sendChatRequest);
  const outgoingRequest = useChatStore((s) => s.outgoingRequest);
  const incomingRequest = useChatStore((s) => s.incomingRequest);
  const cancelOutgoingRequest = useChatStore((s) => s.cancelOutgoingRequest);
  const acceptRequest = useChatStore((s) => s.acceptRequest);
  const rejectRequest = useChatStore((s) => s.rejectRequest);
  const activeConversation = useChatStore((s) => s.activeConversation);

  // Redirect to chat room if conversation just started
  useEffect(() => {
    if (activeConversation) {
      navigate("/chat", { replace: true });
    }
  }, [activeConversation, navigate]);

  useEffect(() => {
    fetchAvailableUsers();
  }, [fetchAvailableUsers]);

  const handleSendRequest = useCallback(
    (userId) => {
      sendChatRequest(userId);
    },
    [sendChatRequest]
  );

  const handleAccept = useCallback(() => {
    if (!incomingRequest) return;
    acceptRequest(incomingRequest.requestId);
  }, [incomingRequest, acceptRequest]);

  const handleReject = useCallback(() => {
    if (!incomingRequest) return;
    rejectRequest(incomingRequest.requestId);
  }, [incomingRequest, rejectRequest]);

  const myUsername = authUser?.anonymousUsername ?? "...";

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-start p-3 sm:p-5 md:p-8"
      style={frameStyle}
    >
      {/* Incoming request modal */}
      {incomingRequest && (
        <IncomingRequestModal
          fromUsername={incomingRequest.fromUsername}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        {/* Header */}
        <header className="flex items-center justify-between rounded-2xl border border-border bg-background/80 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-2">
            <AppLogo size={28} className="rounded-[7px]" />
            <span className="text-base font-bold tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-1">
            <WallpaperPicker />
            <ThemePresetPicker />
            <ThemeToggle />
            <UserButton
              appearance={{ elements: { avatarBox: "size-8" } }}
            />
          </div>
        </header>

        {/* Identity card */}
        <div className="rounded-2xl border border-border bg-background/80 backdrop-blur px-5 py-5 text-center">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted">
            Your anonymous identity
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {myUsername}
          </p>
          <p className="mt-2 text-xs text-muted">
            Talk freely. Stay anonymous. No judgment. No permanent history.
          </p>
        </div>

        {/* Outgoing request banner */}
        {outgoingRequest && (
          <OutgoingRequestBanner
            toUsername={outgoingRequest.toUsername}
            onCancel={cancelOutgoingRequest}
          />
        )}

        {/* Available users */}
        <div className="rounded-2xl border border-border bg-background/80 backdrop-blur overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4 text-accent" strokeWidth={2} />
              <span className="text-sm font-semibold">People Available</span>
              {availableUsers.length > 0 && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                  {availableUsers.length}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              isLoading={isAvailableUsersLoading}
              onPress={fetchAvailableUsers}
              aria-label="Refresh"
            >
              <RefreshCwIcon className="size-4" strokeWidth={2} />
            </Button>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {isAvailableUsersLoading && availableUsers.length === 0 ? (
              <div className="flex flex-col gap-3 px-4 py-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="size-9 rounded-full bg-border/50" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-28 rounded bg-border/50" />
                      <div className="h-2.5 w-20 rounded bg-border/30" />
                    </div>
                    <div className="h-8 w-24 rounded-lg bg-border/50" />
                  </div>
                ))}
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No one available right now</p>
                <p className="mt-1 text-xs text-muted">
                  Check back soon — others will appear here when they come online.
                </p>
              </div>
            ) : (
              availableUsers.map((user) => (
                <AvailableUserCard
                  key={String(user.userId)}
                  user={user}
                  disabled={!!outgoingRequest}
                  onSendRequest={() => handleSendRequest(user.userId)}
                />
              ))
            )}
          </div>
        </div>

        {/* Privacy notice */}
        <p className="text-center text-[11px] text-muted">
          🔒 Conversations are private, temporary, and permanently deleted when ended.
        </p>
      </div>
    </div>
  );
}

export default LobbyPage;
