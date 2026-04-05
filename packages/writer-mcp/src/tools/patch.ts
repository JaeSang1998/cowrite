import { previewPatch } from "@cowrite/writer-core";
import { applyPatchToFile, recordFeedbackToFile } from "@cowrite/writer-storage";
import { getActiveDocPath, loadWorkspace, jsonContent, type ToolResult } from "../helpers.js";
import { patchContainerInput, rejectPatchInput } from "../schemas.js";

export async function handlePatchPreview(args: unknown): Promise<ToolResult> {
  const input = patchContainerInput.parse(args ?? {});
  const workspace = await loadWorkspace();
  return jsonContent(previewPatch(workspace.document, input.patch));
}

export async function handlePatchApply(args: unknown): Promise<ToolResult> {
  const input = patchContainerInput.parse(args ?? {});
  const result = await applyPatchToFile({
    patch: input.patch,
    docPath: getActiveDocPath(),
  });
  return jsonContent({
    patchId: input.patch.patchId,
    snapshotRef: result.snapshotRef,
  });
}

export async function handlePatchReject(args: unknown): Promise<ToolResult> {
  const input = rejectPatchInput.parse(args ?? {});
  await recordFeedbackToFile({
    docPath: getActiveDocPath(),
    feedback: {
      patchId: input.patch.patchId,
      instruction: input.patch.instruction,
      outcome: "rejected",
      note: input.note,
    },
  });
  return jsonContent({
    patchId: input.patch.patchId,
    status: "rejected",
  });
}
