import { useEffect, useState, useCallback, useRef } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { useThreadStore } from "@/store/threadStore";
import { getPersonaColor, useCursorStore } from "@/store/cursorStore";
import { getTextRangeRects } from "@/lib/textRects";
import type { Annotation, Thread } from "@cowrite/writer-core";

interface HighlightEntry {
  annotation: Annotation;
  thread: Thread | undefined;
  rects: DOMRect[];
}

function getAnimatingAnnotationIds(): Set<string> {
  return new Set(useCursorStore.getState().cursors.map((c) => c.annotationId));
}

function useAnnotationRects(containerRef: React.RefObject<HTMLElement | null>) {
  const document = useDocumentStore((s) => s.document);
  const cursorCount = useCursorStore((s) => s.cursors.length);
  const [highlights, setHighlights] = useState<HighlightEntry[]>([]);
  const rafRef = useRef(0);

  const compute = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const animatingIds = getAnimatingAnnotationIds();
    const results: HighlightEntry[] = [];

    for (const annotation of document.annotations) {
      if (animatingIds.has(annotation.id)) continue;

      const thread = document.threads.find(
        (t) => t.id === annotation.threadId
      );

      if (thread?.resolved) continue;

      const result = getTextRangeRects(
        annotation.anchor.blockId,
        annotation.anchor.start,
        annotation.anchor.end,
        container,
        annotation.anchor.quote
      );

      if (result) {
        results.push({ annotation, thread, rects: result.rects });
      }
    }

    setHighlights(results);
  }, [document.annotations, document.threads, cursorCount, containerRef]);

  const scheduleCompute = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(compute);
  }, [compute]);

  useEffect(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", scheduleCompute, { passive: true });
    window.addEventListener("resize", scheduleCompute);

    const observer = new MutationObserver(scheduleCompute);
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener("scroll", scheduleCompute);
      window.removeEventListener("resize", scheduleCompute);
      observer.disconnect();
    };
  }, [scheduleCompute, containerRef]);

  return highlights;
}

export function AnnotationHighlightOverlay({
  containerRef
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const highlights = useAnnotationRects(containerRef);
  const activeThreadId = useThreadStore((s) => s.activeThreadId);
  const hoveredThreadId = useThreadStore((s) => s.hoveredThreadId);
  const setActiveThread = useThreadStore((s) => s.setActiveThread);

  if (highlights.length === 0 || !containerRef.current) return null;

  const container = containerRef.current;
  const containerRect = container.getBoundingClientRect();

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {highlights.map(({ annotation, thread, rects }) => {
        const threadId = thread?.id;
        const isActive = activeThreadId === threadId;
        const isHovered = hoveredThreadId === threadId;
        const firstComment = thread?.comments[0];
        const color =
          firstComment?.role === "assistant"
            ? getPersonaColor(firstComment.authorId)
            : "#f59e0b";

        return (
          <div key={annotation.id}>
            {rects.map((rect, i) => {
              const left = rect.left - containerRect.left + container.scrollLeft;
              const top = rect.top - containerRect.top + container.scrollTop;

              return (
                <div
                  key={i}
                  className="pointer-events-auto absolute cursor-pointer rounded-[2px]"
                  style={{
                    left,
                    top,
                    width: rect.width,
                    height: rect.height,
                    backgroundColor: color,
                    opacity: isActive ? 0.28 : isHovered ? 0.22 : 0.1,
                    transition: "opacity 200ms ease",
                    "--tw-ring-color": color
                  } as React.CSSProperties}
                  onClick={() => {
                    if (thread) {
                      setActiveThread(isActive ? null : thread.id);
                    }
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
