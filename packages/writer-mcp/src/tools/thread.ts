import { findBlockById } from "@cowrite/writer-core";
import { addCommentToFile } from "@cowrite/writer-storage";
import { getActiveDocPath, getActivePersonaContext, jsonContent, type ToolResult } from "../helpers.js";
import { addCommentInput } from "../schemas.js";

export async function handleAddComment(args: unknown): Promise<ToolResult> {
  const input = addCommentInput.parse(args ?? {});
  const { workspace, persona } = await getActivePersonaContext();
  const block = findBlockById(workspace.document.blocks, input.blockId);

  if (!block) {
    throw new Error(`Block "${input.blockId}" was not found.`);
  }

  const blockText = block.content.map((node) => node.text).join("");
  const quote = blockText.slice(input.start, input.end);

  const result = await addCommentToFile({
    comment: {
      blockId: input.blockId,
      start: input.start,
      end: input.end,
      quote,
      body: input.body,
      authorId: input.personaId ?? persona.id,
      role: "assistant",
    },
    docPath: getActiveDocPath(),
  });

  return jsonContent({
    threadId: result.threadId,
    annotationId: result.annotationId,
    commentId: result.commentId,
    quote,
    body: input.body,
    personaId: input.personaId ?? persona.id,
    personaName: persona.name,
  });
}
