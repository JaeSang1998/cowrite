import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useThreadStore } from "@/store/threadStore";
import { cn } from "@/lib/utils";

export function PendingCommentInput() {
  const { pendingComment, commitPendingComment, cancelPendingComment } =
    useThreadStore();
  const [body, setBody] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingComment) {
      setBody("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [pendingComment]);

  if (!pendingComment) return null;

  const handleSubmit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    commitPendingComment(trimmed);
    setBody("");
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;

    if (!body.trim()) {
      cancelPendingComment();
    } else {
      commitPendingComment(body.trim());
      setBody("");
    }
  };

  return (
    <div ref={containerRef} className="rounded-lg border border-indigo-300 bg-background p-3 shadow-sm ring-1 ring-indigo-200">
      <div className="flex gap-2.5">
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-400 text-[10px] font-semibold text-white">
          나
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[13px] font-semibold text-foreground">나</span>
          <div className="mt-1.5">
            <textarea
              ref={inputRef as any}
              placeholder="댓글 입력..."
              className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
                if (e.key === "Escape") {
                  cancelPendingComment();
                }
              }}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!body.trim()}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-1 text-xs text-white transition-colors",
                body.trim()
                  ? "bg-indigo-500 hover:bg-indigo-600"
                  : "cursor-not-allowed bg-indigo-300"
              )}
            >
              <ArrowUp size={12} strokeWidth={2.5} />
              댓글 달기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScrollIntoView({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [active]);
  return <div ref={ref} />;
}
