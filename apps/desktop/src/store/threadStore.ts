import { create } from "zustand";
import {
  addCommentToDocument,
  createId,
  findBlockById,
  getBlockPlainText,
  nowIso,
} from "@cowrite/writer-core";
import { useDocumentStore } from "./documentStore";

export interface PendingComment {
  blockId: string;
  start: number;
  end: number;
  quote: string;
  rect: { top: number; left: number; bottom: number; width: number };
}

interface ThreadState {
  activeThreadId: string | null;
  hoveredThreadId: string | null;
  showThreadPanel: boolean;
  pendingComment: PendingComment | null;

  setActiveThread: (threadId: string | null) => void;
  setHoveredThread: (threadId: string | null) => void;
  setShowThreadPanel: (show: boolean) => void;
  resolveThread: (threadId: string) => void;
  unresolveThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  deleteComment: (threadId: string, commentId: string) => void;
  editComment: (threadId: string, commentId: string, body: string) => void;
  addReply: (threadId: string, body: string, parentId?: string) => void;
  addComment: (blockId: string, start: number, end: number, body: string) => void;
  startComment: (blockId: string, start: number, end: number, quote: string, rect: PendingComment["rect"]) => void;
  commitPendingComment: (body: string) => void;
  cancelPendingComment: () => void;
}

const mutateDoc = useDocumentStore.getState().mutateDocument;
const now = () => new Date().toISOString();

export const useThreadStore = create<ThreadState>((set, get) => ({
  activeThreadId: null,
  hoveredThreadId: null,
  showThreadPanel: true,
  pendingComment: null,

  setActiveThread: (threadId) => {
    set({ activeThreadId: threadId, ...(threadId ? { showThreadPanel: true } : {}) });
  },

  setHoveredThread: (threadId) => set({ hoveredThreadId: threadId }),

  setShowThreadPanel: (show) => set({ showThreadPanel: show }),

  resolveThread: (threadId) => {
    useDocumentStore.getState().mutateDocument((doc) => ({
      ...doc,
      threads: doc.threads.map((t) => (t.id === threadId ? { ...t, resolved: true } : t)),
      metadata: { ...doc.metadata, updatedAt: now() },
    }));
    set((state) => ({
      activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
    }));
  },

  unresolveThread: (threadId) => {
    useDocumentStore.getState().mutateDocument((doc) => ({
      ...doc,
      threads: doc.threads.map((t) => (t.id === threadId ? { ...t, resolved: false } : t)),
      metadata: { ...doc.metadata, updatedAt: now() },
    }));
  },

  deleteThread: (threadId) => {
    useDocumentStore.getState().mutateDocument((doc) => {
      const thread = doc.threads.find((t) => t.id === threadId);
      return {
        ...doc,
        threads: doc.threads.filter((t) => t.id !== threadId),
        annotations: doc.annotations.filter((a) => a.id !== thread?.annotationId),
        metadata: { ...doc.metadata, updatedAt: now() },
      };
    });
    set((state) => ({
      activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
    }));
  },

  deleteComment: (threadId, commentId) => {
    useDocumentStore.getState().mutateDocument((doc) => {
      const thread = doc.threads.find((t) => t.id === threadId);
      if (!thread) return doc;

      const remaining = thread.comments.filter((c) => c.id !== commentId);
      if (remaining.length === 0) {
        return {
          ...doc,
          threads: doc.threads.filter((t) => t.id !== threadId),
          annotations: doc.annotations.filter((a) => a.id !== thread.annotationId),
          metadata: { ...doc.metadata, updatedAt: now() },
        };
      }

      return {
        ...doc,
        threads: doc.threads.map((t) => (t.id === threadId ? { ...t, comments: remaining } : t)),
        metadata: { ...doc.metadata, updatedAt: now() },
      };
    });
    // Clear active if thread was deleted (no comments left)
    const doc = useDocumentStore.getState().document;
    if (!doc.threads.find((t) => t.id === threadId)) {
      set((state) => ({
        activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
      }));
    }
  },

  editComment: (threadId, commentId, body) => {
    useDocumentStore.getState().mutateDocument((doc) => ({
      ...doc,
      threads: doc.threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              comments: t.comments.map((c) =>
                c.id === commentId ? { ...c, body, updatedAt: now() } : c
              ),
            }
          : t
      ),
      metadata: { ...doc.metadata, updatedAt: now() },
    }));
  },

  addReply: (threadId, body, parentId) => {
    const timestamp = nowIso();
    const comment = {
      id: createId("cmt"),
      authorId: "user",
      role: "user" as const,
      body,
      parentId,
      createdAt: timestamp,
    };

    useDocumentStore.getState().mutateDocument((doc) => ({
      ...doc,
      threads: doc.threads.map((t) =>
        t.id === threadId ? { ...t, comments: [...t.comments, comment] } : t
      ),
      metadata: { ...doc.metadata, updatedAt: timestamp },
    }));
  },

  addComment: (blockId, start, end, body) => {
    const doc = useDocumentStore.getState().document;
    const block = findBlockById(doc.blocks, blockId);
    if (!block) return;

    const text = getBlockPlainText(block);
    const quote = text.slice(start, end);
    if (!quote.trim()) return;

    const result = addCommentToDocument(doc, {
      blockId,
      start,
      end,
      quote,
      body,
      authorId: "user",
      role: "user",
    });

    useDocumentStore.getState().mutateDocument(() => result.document);
    set({ activeThreadId: result.threadId, showThreadPanel: true });
  },

  startComment: (blockId, start, end, quote, rect) => {
    set({ pendingComment: { blockId, start, end, quote, rect }, showThreadPanel: true });
  },

  commitPendingComment: (body) => {
    const pc = get().pendingComment;
    if (!pc) return;

    const doc = useDocumentStore.getState().document;
    const result = addCommentToDocument(doc, {
      blockId: pc.blockId,
      start: pc.start,
      end: pc.end,
      quote: pc.quote,
      body,
      authorId: "user",
      role: "user",
    });

    useDocumentStore.getState().mutateDocument(() => result.document);
    set({ activeThreadId: result.threadId, pendingComment: null });
  },

  cancelPendingComment: () => set({ pendingComment: null }),
}));
