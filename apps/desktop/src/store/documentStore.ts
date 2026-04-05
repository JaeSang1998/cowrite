import { create } from "zustand";
import {
  blockNoteDocumentToCanonical,
  createDraftDocument,
  type BlockNoteBlockLike,
  type WriterDocument,
} from "@cowrite/writer-core";

export interface DocumentListItem {
  path: string;
  docId: string;
  title: string;
}

interface DocumentState {
  document: WriterDocument;
  documentPath: string | null;
  documentList: DocumentListItem[];
  editorSeed: number;

  loadDocument: (doc: WriterDocument, path?: string, opts?: { resetCanvas?: boolean }) => void;
  setDocumentList: (list: DocumentListItem[]) => void;
  syncFromBlocks: (blocks: BlockNoteBlockLike[]) => void;
  updateTitle: (title: string) => void;
  updateActivePersona: (personaId: string) => void;
  /** Safe entry point for other stores to mutate the document. */
  mutateDocument: (fn: (doc: WriterDocument) => WriterDocument, opts?: { resetCanvas?: boolean }) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: createDraftDocument(),
  documentPath: null,
  documentList: [],
  editorSeed: 0,

  loadDocument: (doc, path, opts) => {
    const resetCanvas = opts?.resetCanvas ?? true;
    set((state) => ({
      document: doc,
      documentPath: path ?? null,
      ...(resetCanvas ? { editorSeed: state.editorSeed + 1 } : {}),
    }));
  },

  setDocumentList: (list) => set({ documentList: list }),

  syncFromBlocks: (blocks) => {
    set((state) => ({
      document: blockNoteDocumentToCanonical(state.document, blocks),
    }));
  },

  updateTitle: (title) => {
    const newTitle = title || "Untitled";
    set((state) => ({
      document: {
        ...state.document,
        title: newTitle,
        metadata: { ...state.document.metadata, updatedAt: new Date().toISOString() },
      },
      documentList: state.documentList.map((item) =>
        item.docId === state.document.docId ? { ...item, title: newTitle } : item
      ),
    }));
  },

  updateActivePersona: (personaId) => {
    set((state) => ({
      document: {
        ...state.document,
        activePersonaId: personaId,
        metadata: { ...state.document.metadata, updatedAt: new Date().toISOString() },
      },
    }));
  },

  mutateDocument: (fn, opts) => {
    set((state) => ({
      document: fn(state.document),
      ...(opts?.resetCanvas ? { editorSeed: state.editorSeed + 1 } : {}),
    }));
  },
}));
