import { createPatchProposal, findBlockById } from "@cowrite/writer-core";
import { rewriteSelectionLocally } from "@cowrite/writer-ai";
import { getActivePersonaContext, jsonContent, type ToolResult } from "../helpers.js";
import { rewriteSelectionInput } from "../schemas.js";

export async function handleRewriteSelection(args: unknown): Promise<ToolResult> {
  const input = rewriteSelectionInput.parse(args ?? {});
  const { workspace, persona } = await getActivePersonaContext();
  const block = findBlockById(workspace.document.blocks, input.blockId);

  if (!block) {
    throw new Error(`Block "${input.blockId}" was not found.`);
  }

  const blockText = block.content.map((node) => node.text).join("");
  const selectionText = blockText.slice(input.start, input.end);
  const localRewrite = rewriteSelectionLocally({
    selectionText,
    instruction: input.instruction,
    persona,
    preferenceProfile: workspace.preferences,
  });
  const patch = createPatchProposal(workspace.document, {
    docId: workspace.document.docId,
    blockId: input.blockId,
    start: input.start,
    end: input.end,
    after: input.proposedText ?? localRewrite.text,
    reason: localRewrite.reason,
    instruction: input.instruction,
    createdBy: "writer-mcp",
  });

  return jsonContent({
    patch,
    candidates: localRewrite.candidates,
  });
}
