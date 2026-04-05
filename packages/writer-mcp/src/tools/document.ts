import path from "node:path";
import { listLocalDocuments, createDocumentFile, exportDocumentFileAsMarkdown } from "@cowrite/writer-storage";
import { getActiveDocPath, loadWorkspace, jsonContent, type ToolResult } from "../helpers.js";
import { createDocumentInput } from "../schemas.js";

export async function handleDocumentList(): Promise<ToolResult> {
  const documents = await listLocalDocuments(path.dirname(getActiveDocPath()));
  return jsonContent({ documents });
}

export async function handleDocumentRead(): Promise<ToolResult> {
  const workspace = await loadWorkspace();
  return jsonContent({ path: workspace.paths.docPath, document: workspace.document });
}

export async function handleDocumentCreate(args: unknown): Promise<ToolResult> {
  const input = createDocumentInput.parse(args ?? {});
  const workspace = await createDocumentFile({
    title: input.title,
    activePersonaId: input.activePersonaId,
  });
  return jsonContent({ path: workspace.paths.docPath, document: workspace.document });
}

export async function handleDocumentExport(): Promise<ToolResult> {
  const result = await exportDocumentFileAsMarkdown({ docPath: getActiveDocPath() });
  return jsonContent(result);
}
