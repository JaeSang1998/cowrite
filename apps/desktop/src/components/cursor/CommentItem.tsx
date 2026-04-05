import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { usePersonaStore } from "@/store/personaStore";
import { useThreadStore } from "@/store/threadStore";
import { getPersonaColor } from "@/store/cursorStore";
import { formatTime } from "@/lib/formatters";
import type { Thread, ThreadComment } from "@cowrite/writer-core";

export function CommentItem({
  comment,
  thread,
}: {
  comment: ThreadComment;
  thread: Thread;
}) {
  const personas = usePersonaStore((s) => s.personas);
  const { deleteComment, editComment } = useThreadStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);

  const persona = personas.find((p) => p.id === comment.authorId);
  const isUser = comment.role === "user";
  const color = comment.role === "assistant" ? getPersonaColor(comment.authorId) : undefined;

  const handleSaveEdit = () => {
    const trimmed = editBody.trim();
    if (trimmed && trimmed !== comment.body) {
      editComment(thread.id, comment.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditBody(comment.body);
    setIsEditing(false);
  };

  return (
    <div className="group relative flex gap-2.5 py-1">
      <div
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ backgroundColor: color ?? "#94a3b8" }}
      >
        {(isUser ? "나" : (persona?.name ?? "?")).charAt(0)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[13px] font-semibold"
            style={{ color: color ?? undefined }}
          >
            {isUser ? "나" : (persona?.name ?? comment.authorId)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatTime(comment.createdAt)}
          </span>
          {comment.updatedAt && (
            <span className="text-[11px] text-muted-foreground/50">
              (수정됨)
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1.5 flex flex-col gap-1.5">
            <textarea
              className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-sm leading-relaxed text-foreground shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={2}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-md bg-indigo-500 px-2.5 py-0.5 text-xs text-white hover:bg-indigo-600"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-[13px] leading-relaxed text-foreground">
            {comment.body}
          </p>
        )}

        {!isEditing && (
          <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {isUser && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditBody(comment.body);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="수정"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteComment(thread.id, comment.id);
                  }}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-red-50 hover:text-red-500"
                  title="삭제"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
