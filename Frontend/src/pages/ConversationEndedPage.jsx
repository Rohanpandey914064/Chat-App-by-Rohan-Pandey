import { useNavigate } from "react-router";
import { useWallpaper } from "../context/wallpaper";
import { Button } from "@heroui/react";
import { ShieldCheckIcon, TrashIcon } from "lucide-react";

function ConversationEndedPage() {
  const navigate = useNavigate();
  const { frameStyle } = useWallpaper();

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center p-6"
      style={frameStyle}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border bg-background/90 backdrop-blur px-8 py-10 text-center">
        {/* Icon */}
        <div className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <ShieldCheckIcon className="size-8" strokeWidth={1.5} />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight">Conversation Ended</h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Your conversation has been permanently deleted.
          </p>
        </div>

        {/* Deletion confirmation */}
        <div className="w-full rounded-xl border border-border bg-surface/50 px-4 py-4 text-left space-y-2">
          {[
            "All messages permanently deleted",
            "Conversation record removed",
            "No chat history remains",
            "Your identity stays anonymous",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <TrashIcon className="mt-0.5 size-3.5 shrink-0 text-muted" strokeWidth={2} />
              <p className="text-xs text-muted">{item}</p>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="rounded-xl font-semibold"
          onPress={() => navigate("/", { replace: true })}
        >
          Find Someone New
        </Button>

        <p className="text-[11px] text-muted">
          Talk freely. Stay anonymous. No judgment.
        </p>
      </div>
    </div>
  );
}

export default ConversationEndedPage;
