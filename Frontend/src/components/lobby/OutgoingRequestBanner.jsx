import { Button } from "@heroui/react";
import { ClockIcon, XIcon } from "lucide-react";

function OutgoingRequestBanner({ toUsername, onCancel }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/8 px-4 py-3"
    >
      <ClockIcon className="size-4 shrink-0 animate-pulse text-accent" strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Waiting for response…</p>
        <p className="text-xs text-muted truncate">
          Request sent to <span className="font-semibold">{toUsername}</span>
        </p>
      </div>
      <Button
        id="cancel-request-btn"
        variant="ghost"
        size="sm"
        isIconOnly
        className="shrink-0 text-muted hover:text-foreground"
        onPress={onCancel}
        aria-label="Cancel request"
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}

export default OutgoingRequestBanner;
