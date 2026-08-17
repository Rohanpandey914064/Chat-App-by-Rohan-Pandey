import { Button } from "@heroui/react";
import { AlertTriangleIcon, TrashIcon } from "lucide-react";

export function EndConversationModal({ partnerUsername, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-conversation-title"
        className="w-full max-w-sm rounded-3xl border border-border bg-background px-6 py-8 shadow-2xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
            <AlertTriangleIcon className="size-5" strokeWidth={2} />
          </div>
          <h2 id="end-conversation-title" className="text-lg font-bold">
            End this conversation?
          </h2>
        </div>

        <div className="mb-5 rounded-xl border border-border bg-surface/50 px-4 py-4 space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
            After ending:
          </p>
          {[
            "The conversation will be closed immediately",
            "All messages will be permanently deleted",
            "You will not be able to access this chat again",
            `${partnerUsername} will be notified`,
            "You can start a new anonymous conversation",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <TrashIcon className="mt-0.5 size-3.5 shrink-0 text-danger/60" strokeWidth={2} />
              <p className="text-xs text-muted">{item}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            id="cancel-end-btn"
            variant="flat"
            fullWidth
            size="lg"
            className="rounded-xl font-semibold"
            onPress={onCancel}
          >
            Cancel
          </Button>
          <Button
            id="confirm-end-btn"
            variant="solid"
            color="danger"
            fullWidth
            size="lg"
            className="rounded-xl font-semibold"
            onPress={onConfirm}
          >
            End Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
