import { create } from "zustand";
import { rewriteSelectionLocally } from "@cowrite/writer-ai";
import {
  appendFeedback,
  applyPatch,
  createPatchProposal,
  findBlockById,
  getBlockPlainText,
  starterPreferenceProfile,
  type PatchProposal,
  type PreferenceProfile,
} from "@cowrite/writer-core";
import { useDocumentStore } from "./documentStore";
import { usePersonaStore, getActivePersona } from "./personaStore";
import { useSelectionStore } from "./selectionStore";

interface PatchState {
  pendingPatches: PatchProposal[];
  preferences: PreferenceProfile;

  queuePatch: (instruction: string) => void;
  applyPatchById: (patchId: string) => void;
  rejectPatchById: (patchId: string) => void;
}

export const usePatchStore = create<PatchState>((set, get) => ({
  pendingPatches: [],
  preferences: starterPreferenceProfile,

  queuePatch: (instruction) => {
    const doc = useDocumentStore.getState().document;
    const personas = usePersonaStore.getState().personas;
    const selection = useSelectionStore.getState().selection;
    const activePersona = getActivePersona(personas, doc.activePersonaId);

    const block = findBlockById(doc.blocks, selection.blockId);
    if (!block) return;

    const text = getBlockPlainText(block);
    if (!text.trim()) return;

    const start = selection.start;
    const end = selection.end > selection.start ? selection.end : text.length;
    const selectionText = text.slice(start, end);
    if (!selectionText.trim()) return;

    const rewrite = rewriteSelectionLocally({
      selectionText,
      instruction,
      persona: activePersona,
      preferenceProfile: get().preferences,
    });

    const patch = createPatchProposal(doc, {
      docId: doc.docId,
      blockId: block.id,
      start,
      end,
      after: rewrite.text,
      reason: rewrite.reason,
      instruction,
      createdBy: "desktop",
    });

    set((state) => ({ pendingPatches: [patch, ...state.pendingPatches] }));
  },

  applyPatchById: (patchId) => {
    const state = get();
    const patch = state.pendingPatches.find((p) => p.patchId === patchId);
    if (!patch) return;

    useDocumentStore.getState().mutateDocument(
      (doc) => applyPatch(doc, patch),
      { resetCanvas: true }
    );

    set({
      preferences: appendFeedback(state.preferences, {
        patchId,
        instruction: patch.instruction,
        outcome: "accepted",
        note: patch.reason,
      }),
      pendingPatches: state.pendingPatches.filter((p) => p.patchId !== patchId),
    });
  },

  rejectPatchById: (patchId) => {
    const state = get();
    const patch = state.pendingPatches.find((p) => p.patchId === patchId);
    if (!patch) return;

    set({
      preferences: appendFeedback(state.preferences, {
        patchId,
        instruction: patch.instruction,
        outcome: "rejected",
        note: "desktop rejection",
      }),
      pendingPatches: state.pendingPatches.filter((p) => p.patchId !== patchId),
    });
  },
}));
