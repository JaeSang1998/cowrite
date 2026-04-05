import { useState, useEffect } from "react";
import { useThreadStore } from "@/store/threadStore";
import { getTextRangeRects } from "@/lib/textRects";

/**
 * Renders a highlight overlay on the pending comment's text range.
 * Listens for editor clicks: if input is empty → cancel, if has content → commit.
 */
export function PendingCommentHighlight({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const pendingComment = useThreadStore((s) => s.pendingComment);
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([]);

  useEffect(() => {
    if (pendingComment) {
      const container = containerRef.current;
      if (container) {
        const result = getTextRangeRects(
          pendingComment.blockId,
          pendingComment.start,
          pendingComment.end,
          container
        );
        setHighlightRects(result?.rects ?? []);
      }
    } else {
      setHighlightRects([]);
    }
  }, [pendingComment, containerRef]);

  if (!pendingComment || highlightRects.length === 0) return null;

  const container = containerRef.current;
  if (!container) return null;
  const containerRect = container.getBoundingClientRect();

  return (
    <>
      {highlightRects.map((rect, i) => (
        <div
          key={i}
          className="pointer-events-none absolute z-30 rounded-sm"
          style={{
            top: rect.top - containerRect.top + container.scrollTop,
            left: rect.left - containerRect.left,
            width: rect.width,
            height: rect.height,
            background: "hsl(220 80% 55% / 0.18)",
          }}
        />
      ))}
    </>
  );
}
