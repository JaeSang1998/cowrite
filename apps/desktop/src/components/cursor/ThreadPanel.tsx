import { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { useDocumentStore } from "@/store/documentStore";
import { useThreadStore } from "@/store/threadStore";
import { getTextRangeRects } from "@/lib/textRects";
import { ThreadCard } from "./ThreadCard";
import { PendingCommentInput, ScrollIntoView } from "./PendingCommentInput";
import type { Thread } from "@cowrite/writer-core";

interface ThreadPosition {
  thread: Thread;
  top: number;
}

const MIN_GAP = 8;

function useThreadPositions(
  threads: Thread[],
  editorContainer: HTMLElement | null
) {
  const document = useDocumentStore((s) => s.document);
  const [positions, setPositions] = useState<ThreadPosition[]>([]);
  const rafRef = useRef(0);

  const compute = useCallback(() => {
    if (!editorContainer) return;

    const containerRect = editorContainer.getBoundingClientRect();
    const results: ThreadPosition[] = [];

    for (const thread of threads) {
      const annotation = document.annotations.find(
        (a) => a.id === thread.annotationId
      );
      if (!annotation) continue;

      const result = getTextRangeRects(
        annotation.anchor.blockId,
        annotation.anchor.start,
        annotation.anchor.end,
        editorContainer,
        annotation.anchor.quote
      );

      if (result) {
        const top =
          result.bounds.top - containerRect.top + editorContainer.scrollTop;
        results.push({ thread, top });
      } else {
        results.push({ thread, top: Infinity });
      }
    }

    results.sort((a, b) => a.top - b.top);
    setPositions(results);
  }, [threads, document.annotations, editorContainer]);

  useEffect(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    if (!editorContainer) return;

    const schedule = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(compute);
    };

    window.addEventListener("resize", schedule);
    const observer = new MutationObserver(schedule);
    observer.observe(editorContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [compute, editorContainer]);

  return positions;
}

export function ThreadPanel({
  editorContainerRef,
}: {
  editorContainerRef: React.RefObject<HTMLElement | null>;
}) {
  const document = useDocumentStore((s) => s.document);
  const { activeThreadId, pendingComment } = useThreadStore();
  const threads = document.threads;

  // Measure actual card heights
  const cardHeights = useRef<Map<string, number>>(new Map());
  const [measureTick, setMeasureTick] = useState(0);

  const measureRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (!el) return;
      const h = el.offsetHeight;
      if (cardHeights.current.get(id) !== h) {
        cardHeights.current.set(id, h);
      }
    },
    []
  );

  // Re-measure after render
  useLayoutEffect(() => {
    let changed = false;
    for (const [id, el] of Array.from(
      window.document.querySelectorAll<HTMLDivElement>("[data-thread-card-id]")
    ).map((el) => [el.dataset.threadCardId!, el] as const)) {
      const h = el.offsetHeight;
      if (cardHeights.current.get(id) !== h) {
        cardHeights.current.set(id, h);
        changed = true;
      }
    }
    if (changed) {
      setMeasureTick((n) => n + 1);
    }
  });

  const unresolvedThreads = threads.filter((t) => !t.resolved);
  const resolvedThreads = threads.filter((t) => t.resolved);

  const positions = useThreadPositions(
    unresolvedThreads,
    editorContainerRef.current
  );

  const resolvedPositions = useThreadPositions(
    resolvedThreads,
    editorContainerRef.current
  );

  // Resolve overlaps using measured heights
  const resolveOverlaps = (items: ThreadPosition[]) => {
    const resolved: { thread: Thread; resolvedTop: number }[] = [];
    let lastBottom = -Infinity;

    for (const item of items) {
      const height = cardHeights.current.get(item.thread.id) ?? 70;
      const actualTop = Math.max(item.top, lastBottom + MIN_GAP);
      resolved.push({ thread: item.thread, resolvedTop: actualTop });
      lastBottom = actualTop + height;
    }
    return resolved;
  };

  const resolvedItems = resolveOverlaps(positions);
  const resolvedResolvedItems = resolveOverlaps(resolvedPositions);

  if (threads.length === 0 && !pendingComment) {
    return (
      <div className="flex h-64 flex-col items-center justify-center px-4 pt-12 text-center">
        <MessageSquare size={24} className="mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">아직 댓글이 없습니다</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          AI 에이전트가 MCP를 통해 댓글을 달면
          <br />
          여기에 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {resolvedItems.map(({ thread, resolvedTop }) => (
        <div
          key={thread.id}
          ref={measureRef(thread.id)}
          data-thread-card-id={thread.id}
          className="absolute inset-x-0 px-3 transition-[top] duration-200 ease-out"
          style={{ top: resolvedTop }}
        >
          <ThreadCard thread={thread} isActive={activeThreadId === thread.id} />
        </div>
      ))}

      {resolvedResolvedItems.map(({ thread, resolvedTop }) => (
        <div
          key={thread.id}
          ref={measureRef(thread.id)}
          data-thread-card-id={thread.id}
          className="absolute inset-x-0 px-3 transition-[top] duration-200 ease-out"
          style={{ top: resolvedTop }}
        >
          <ThreadCard thread={thread} isActive={activeThreadId === thread.id} />
        </div>
      ))}
    </div>
  );
}
