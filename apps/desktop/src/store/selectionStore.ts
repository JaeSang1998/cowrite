import { create } from "zustand";
import { findBlockById, getBlockPlainText, type WriterDocument } from "@cowrite/writer-core";
import { useDocumentStore } from "./documentStore";

export interface SelectionState {
  blockId: string;
  start: number;
  end: number;
}

function clampSelection(document: WriterDocument, selection: SelectionState): SelectionState {
  const block = findBlockById(document.blocks, selection.blockId) ?? document.blocks[0];
  if (!block) return selection;

  const text = getBlockPlainText(block);
  const start = Math.max(0, Math.min(selection.start, text.length));
  const end = Math.max(start, Math.min(selection.end, text.length));

  return { blockId: block.id, start, end };
}

interface SelectionStoreState {
  selection: SelectionState;
  setSelection: (next: Partial<SelectionState>) => void;
}

export const useSelectionStore = create<SelectionStoreState>((set) => ({
  selection: { blockId: "blk_new", start: 0, end: 0 },

  setSelection: (next) => {
    const doc = useDocumentStore.getState().document;
    set((state) => ({
      selection: clampSelection(doc, { ...state.selection, ...next }),
    }));
  },
}));
