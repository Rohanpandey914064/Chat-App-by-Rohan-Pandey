import { Button } from "@heroui/react";
import { MessageCircleIcon } from "lucide-react";

function AvailableUserCard({ user, onSendRequest, disabled }) {
  const initial = user.anonymousUsername?.[0] ?? "?";

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/50">
      {/* Anonymous avatar */}
      <div className="relative shrink-0">
        <div className="flex size-10 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent select-none">
          {initial}
        </div>
        {/* Online dot */}
        <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-success" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold">{user.anonymousUsername}</p>
        <p className="text-xs text-muted">Available to chat</p>
      </div>

      <Button
        id={`send-request-${String(user.userId)}`}
        variant="flat"
        size="sm"
        color="primary"
        isDisabled={disabled}
        onPress={onSendRequest}
        className="shrink-0 gap-1.5 text-xs font-medium"
      >
        <MessageCircleIcon className="size-3.5" strokeWidth={2} />
        Send Request
      </Button>
    </div>
  );
}

export default AvailableUserCard;
