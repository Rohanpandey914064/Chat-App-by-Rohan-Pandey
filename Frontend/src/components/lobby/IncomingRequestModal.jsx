import { Button } from "@heroui/react";
import { CheckIcon, XIcon } from "lucide-react";

function IncomingRequestModal({ fromUsername, onAccept, onReject }) {
  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="incoming-request-title"
        className="w-full max-w-sm rounded-3xl border border-border bg-background px-6 py-8 text-center shadow-2xl"
      >
        {/* Anonymous avatar */}
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-accent/20 text-2xl font-bold text-accent select-none">
          ?
        </div>

        <p className="text-xs font-medium uppercase tracking-widest text-muted mb-1">
          Someone wants to talk
        </p>
        <h2 id="incoming-request-title" className="text-xl font-bold">
          {fromUsername}
        </h2>
        <p className="mt-2 text-xs text-muted">
          They will remain anonymous. You will remain anonymous. No names. No history.
        </p>

        <div className="mt-6 flex gap-3">
          <Button
            id="reject-request-btn"
            variant="flat"
            color="default"
            fullWidth
            size="lg"
            className="rounded-xl font-semibold"
            onPress={onReject}
          >
            <XIcon className="size-4" />
            Decline
          </Button>
          <Button
            id="accept-request-btn"
            variant="primary"
            color="primary"
            fullWidth
            size="lg"
            className="rounded-xl font-semibold"
            onPress={onAccept}
          >
            <CheckIcon className="size-4" />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

export default IncomingRequestModal;
