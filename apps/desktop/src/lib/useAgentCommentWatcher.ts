import { useEffect, useRef } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { usePersonaStore } from "@/store/personaStore";
import {
  useCursorStore,
  getPersonaColor,
  type AgentCursorState
} from "@/store/cursorStore";
import type { Thread } from "@cowrite/writer-core";

/**
 * Watches for new AI-authored comments in the document
 * and triggers cursor animations.
 *
 * Only animates comments that appear AFTER the watcher has
 * initialized for the current document. Switching documents
 * resets the known state without triggering animations.
 */
export function useAgentCommentWatcher() {
  const writerDocument = useDocumentStore((s) => s.document);
  const personas = usePersonaStore((s) => s.personas);
  const addCursor = useCursorStore((s) => s.addCursor);

  const knownDocId = useRef<string | null>(null);
  const seenAssistantCommentKeys = useRef(new Set<string>());
  const timeoutMap = useRef(new Map<string, number>());

  const clearScheduled = () => {
    for (const timeoutId of timeoutMap.current.values()) {
      window.clearTimeout(timeoutId);
    }
    timeoutMap.current.clear();
  };

  useEffect(() => {
    return () => {
      clearScheduled();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEntryPoint = () => {
    const container = window.document.querySelector(
      "[data-editor-container]"
    ) as HTMLElement | null;

    if (!container) {
      return {
        x: window.innerWidth * 0.55 + Math.random() * 80,
        y: 40 + Math.random() * 40,
      };
    }

    const minX = container.scrollLeft + container.clientWidth * 0.65;
    const maxX = container.scrollLeft + container.clientWidth - 72;
    const x = Math.min(maxX, minX + Math.random() * 90);
    const y = container.scrollTop + 24 + Math.random() * 52;

    return { x, y };
  };

  useEffect(() => {
    // If document changed, reset known state without animating old comments.
    if (knownDocId.current !== writerDocument.docId) {
      clearScheduled();
      knownDocId.current = writerDocument.docId;
      const seen = new Set<string>();
      for (const t of writerDocument.threads) {
        for (const c of t.comments) {
          if (c.role === "assistant") {
            seen.add(`${t.id}:${c.id}`);
          }
        }
      }
      seenAssistantCommentKeys.current = seen;
      return;
    }

    const pending: Thread[] = [];
    for (const thread of writerDocument.threads) {
      const lastComment = thread.comments[thread.comments.length - 1];
      if (!lastComment || lastComment.role !== "assistant") continue;

      const key = `${thread.id}:${lastComment.id}`;
      if (
        seenAssistantCommentKeys.current.has(key) ||
        timeoutMap.current.has(key)
      ) {
        continue;
      }

      seenAssistantCommentKeys.current.add(key);
      pending.push(thread);
    }

    for (const [idx, thread] of pending.entries()) {
      const lastComment = thread.comments[thread.comments.length - 1];
      if (!lastComment) continue;

      const annotation = writerDocument.annotations.find(
        (a) => a.id === thread.annotationId
      );
      if (!annotation) continue;

      const persona = personas.find((p) => p.id === lastComment.authorId);
      const personaName = persona?.name ?? lastComment.authorId;
      const personaColor = getPersonaColor(lastComment.authorId);

      const entryPoint = getEntryPoint();
      const key = `${thread.id}:${lastComment.id}`;

      const cursorState: AgentCursorState = {
        id: `cursor-${thread.id}-${lastComment.id}`,
        personaName,
        personaColor,
        phase: "entering",
        x: entryPoint.x,
        y: entryPoint.y,
        commentBody: lastComment.body,
        threadId: thread.id,
        annotationId: annotation.id,
        blockId: annotation.anchor.blockId,
        start: annotation.anchor.start,
        end: annotation.anchor.end,
        quote: annotation.anchor.quote
      };

      const delay = 300 + idx * 1500;
      const timeoutId = window.setTimeout(() => {
        timeoutMap.current.delete(key);
        addCursor(cursorState);
      }, delay);
      timeoutMap.current.set(key, timeoutId);
    }
  }, [
    writerDocument.docId,
    writerDocument.threads,
    writerDocument.annotations,
    personas,
    addCursor,
  ]);
}
