import { MessageSquare } from "lucide-react";
import { useDocumentStore } from "@/store/documentStore";
import { useThreadStore } from "@/store/threadStore";
import { cn } from "@/lib/utils";

export function ThreadPanelToggle() {
  const threads = useDocumentStore((s) => s.document.threads);
  const { showThreadPanel, setShowThreadPanel } = useThreadStore();
  const threadCount = threads.filter((t) => !t.resolved).length;

  return (
    <button
      type="button"
      onClick={() => setShowThreadPanel(!showThreadPanel)}
      className={cn(
        "relative flex items-center gap-1.5 rounded-md p-1.5 text-sm transition-colors",
        showThreadPanel
          ? "bg-foreground/10 text-foreground"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      <MessageSquare size={15} />
      {threadCount > 0 && (
        <span className="flex size-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">
          {threadCount}
        </span>
      )}
    </button>
  );
}
