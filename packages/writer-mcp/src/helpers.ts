import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bootstrapLocalWorkspace } from "@cowrite/writer-storage";

const FALLBACK_DOC_PATH = path.resolve(
  process.env.WRITER_DOC_PATH ?? path.join(process.cwd(), "draft.writer.json")
);

const ACTIVE_DOC_FILE = path.join(os.homedir(), ".writer", "active-doc.json");

export function getActiveDocPath(): string {
  try {
    const content = fs.readFileSync(ACTIVE_DOC_FILE, "utf8");
    const parsed = JSON.parse(content) as { path?: string };
    if (parsed.path && fs.existsSync(parsed.path)) {
      return parsed.path;
    }
  } catch {
    // File doesn't exist or is invalid
  }
  return FALLBACK_DOC_PATH;
}

export async function loadWorkspace() {
  return bootstrapLocalWorkspace({ docPath: getActiveDocPath() });
}

export async function getActivePersonaContext() {
  const workspace = await loadWorkspace();
  const persona =
    workspace.personas.personas.find(
      (candidate) => candidate.id === workspace.document.activePersonaId
    ) ?? workspace.personas.personas[0];

  return { workspace, persona };
}

export function jsonContent(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

export type ToolResult = ReturnType<typeof jsonContent>;
