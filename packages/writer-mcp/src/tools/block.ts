import { replaceBlocksInFile, insertBlocksInFile, deleteBlocksInFile } from "@cowrite/writer-storage";
import { getActiveDocPath, jsonContent, type ToolResult } from "../helpers.js";
import { blockReplaceInput, blockReplaceBatchInput, blockInsertInput, blockDeleteInput } from "../schemas.js";

export async function handleBlockInsert(args: unknown): Promise<ToolResult> {
  const input = blockInsertInput.parse(args ?? {});
  const result = await insertBlocksInFile({
    insert: {
      referenceBlockId: input.referenceBlockId,
      position: input.position,
      blocks: input.blocks,
    },
    reason: input.reason,
    docPath: getActiveDocPath(),
  });
  return jsonContent({
    insertedBlockIds: result.insertedBlockIds,
    snapshotRef: result.snapshotRef,
  });
}

export async function handleBlockDelete(args: unknown): Promise<ToolResult> {
  const input = blockDeleteInput.parse(args ?? {});
  const result = await deleteBlocksInFile({
    blockIds: input.blockIds,
    reason: input.reason,
    docPath: getActiveDocPath(),
  });
  return jsonContent({
    deletedBlockIds: input.blockIds,
    snapshotRef: result.snapshotRef,
  });
}

export async function handleBlockReplace(args: unknown): Promise<ToolResult> {
  const input = blockReplaceInput.parse(args ?? {});
  const result = await replaceBlocksInFile({
    replacements: [{ blockId: input.blockId, text: input.text }],
    reason: input.reason,
    docPath: getActiveDocPath(),
  });
  return jsonContent({ replacedBlocks: [input.blockId], snapshotRef: result.snapshotRef });
}

export async function handleBlockReplaceBatch(args: unknown): Promise<ToolResult> {
  const input = blockReplaceBatchInput.parse(args ?? {});
  const result = await replaceBlocksInFile({
    replacements: input.replacements,
    reason: input.reason,
    docPath: getActiveDocPath(),
  });
  return jsonContent({
    replacedBlocks: input.replacements.map((r) => r.blockId),
    snapshotRef: result.snapshotRef,
  });
}
