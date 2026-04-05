import { CheckCircle2, RotateCcw, Trash2, MessageSquare } from "lucide-react";
import { useThreadStore } from "@/store/threadStore";
import { getPersonaColor } from "@/store/cursorStore";
import { usePersonaStore } from "@/store/personaStore";
import { cn } from "@/lib/utils";
import { CommentItem } from "./CommentItem";
import { ReplyInput } from "./ReplyInput";
import { formatTime } from "@/lib/formatters";
import type { Thread, ThreadComment } from "@cowrite/writer-core";

export function getThreadColor(thread: Thread): string {
  const firstAssistant = thread.comments.find((c) => c.role === "assistant");
  if (firstAssistant) return getPersonaColor(firstAssistant.authorId);
  return "#94a3b8";
}

export function ThreadCard({
  thread,
  isActive,
}: {
  thread: Thread;
  isActive: boolean;
}) {
  const { setActiveThread, setHoveredThread, resolveThread, unresolveThread, deleteThread } =
    useThreadStore();
  const personas = usePersonaStore((s) => s.personas);

  const topLevelComments = thread.comments.filter((c) => !c.parentId);
  const repliesByParent = new Map<string, ThreadComment[]>();
  for (const c of thread.comments) {
    if (c.parentId) {
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    }
  }

  const firstComment = topLevelComments[0];
  const totalReplies = thread.comments.length - topLevelComments.length;
  const color = getThreadColor(thread);

  // Collapsed view: just the first comment as a compact summary
  if (!isActive && firstComment) {
    const persona = personas.find((p) => p.id === firstComment.authorId);
    const isUser = firstComment.role === "user";
    const authorColor = firstComment.role === "assistant" ? getPersonaColor(firstComment.authorId) : undefined;
    const authorName = isUser ? "나" : (persona?.name ?? firstComment.authorId);

    return (
      <div
        className={cn(
          "cursor-pointer rounded-lg border border-border/40 bg-card px-3 py-2 transition-all duration-150 hover:border-border/70 hover:shadow-sm",
          thread.resolved && "opacity-40"
        )}
        onClick={() => setActiveThread(thread.id)}
        onMouseEnter={() => setHoveredThread(thread.id)}
        onMouseLeave={() => setHoveredThread(null)}
      >
        <div className="flex items-start gap-2">
          <div
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
            style={{ backgroundColor: authorColor ?? "#94a3b8" }}
          >
            {authorName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[12px] font-medium" style={{ color: authorColor }}>
                {authorName}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatTime(firstComment.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
              {firstComment.body}
            </p>
          </div>
        </div>
        {totalReplies > 0 && (
          <div className="mt-1.5 flex items-center gap-1 pl-7 text-[10px] text-muted-foreground/70">
            <MessageSquare size={10} />
            <span>답글 {totalReplies}개</span>
          </div>
        )}
      </div>
    );
  }

  // Expanded view: full thread with replies and actions
  return (
    <div
      className={cn(
        "cursor-pointer rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-sm transition-all duration-150",
        thread.resolved && "opacity-50"
      )}
      onClick={() => setActiveThread(null)}
      onMouseEnter={() => setHoveredThread(thread.id)}
      onMouseLeave={() => setHoveredThread(null)}
    >
      <div className="space-y-0.5">
        {topLevelComments.map((comment) => {
          const replies = repliesByParent.get(comment.id);
          return (
            <div key={comment.id}>
              <CommentItem comment={comment} thread={thread} />
              {replies && replies.length > 0 && (
                <div
                  className="ml-3 border-l-2 pl-3"
                  style={{ borderColor: color + "30" }}
                >
                  {replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} thread={thread} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!thread.resolved && <ReplyInput threadId={thread.id} />}

      <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteThread(thread.id);
          }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={11} />
          삭제
        </button>
        <div className="flex items-center gap-1">
          {thread.resolved ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                unresolveThread(thread.id);
              }}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw size={11} />
              다시 열기
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resolveThread(thread.id);
              }}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              <CheckCircle2 size={11} />
              해결
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
