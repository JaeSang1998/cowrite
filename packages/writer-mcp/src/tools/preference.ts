import { recordFeedbackToFile } from "@cowrite/writer-storage";
import { getActiveDocPath, jsonContent, type ToolResult } from "../helpers.js";
import { feedbackInput } from "../schemas.js";

export async function handleRecordFeedback(args: unknown): Promise<ToolResult> {
  const input = feedbackInput.parse(args ?? {});
  await recordFeedbackToFile({
    docPath: getActiveDocPath(),
    feedback: input,
  });
  return jsonContent({
    outcome: input.outcome,
    patchId: input.patchId ?? null,
  });
}
