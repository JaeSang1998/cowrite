import type { CreatePatchInput, PatchPreview, PatchProposal, WriterDocument } from "./types.js";
export declare function createPatchProposal(document: WriterDocument, input: CreatePatchInput): PatchProposal;
export declare function previewPatch(document: WriterDocument, patch: PatchProposal): PatchPreview;
export declare function rejectPatch(patch: PatchProposal): PatchProposal;
export declare function applyPatch(document: WriterDocument, patch: PatchProposal): WriterDocument;
//# sourceMappingURL=patch.d.ts.map