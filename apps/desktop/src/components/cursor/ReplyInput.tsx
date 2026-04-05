import { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { useThreadStore } from "@/store/threadStore";
import { cn } from "@/lib/utils";

export function ReplyInput({
  threadId,
  onClick,
}: {
  threadId: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const { addReply } = useThreadStore();
  const [isFocused, setIsFocused] = useState(false);
  const [body, setBody] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    addReply(threadId, trimmed);
    setBody("");
    setIsFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 rounded-lg border px-2.5 transition-all duration-150",
        isFocused
          ? "border-border bg-background py-1.5 shadow-sm"
          : "border-transparent bg-muted/50 py-1.5"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
        inputRef.current?.focus();
      }}
    >
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-400 text-[9px] font-semibold text-white">
        나
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Reply..."
        className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        value={body}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          if (!body.trim()) setIsFocused(false);
        }}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") {
            setBody("");
            setIsFocused(false);
            inputRef.current?.blur();
          }
        }}
      />
      {isFocused && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSubmit();
          }}
          disabled={!body.trim()}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
            body.trim()
              ? "bg-indigo-500 text-white hover:bg-indigo-600"
              : "bg-muted text-muted-foreground/40"
          )}
        >
          <ArrowUp size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
