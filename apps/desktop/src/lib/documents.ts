import type { WriterDocument } from "@cowrite/writer-core";
import type { DocumentListItem } from "@/store/documentStore";

type FsModule = typeof import("@tauri-apps/plugin-fs");

let tauriFs: FsModule | null = null;
let tauriFailed = false;

async function getFs(): Promise<FsModule | null> {
  if (tauriFailed) return null;
  if (tauriFs) return tauriFs;
  try {
    tauriFs = await import("@tauri-apps/plugin-fs");
    return tauriFs;
  } catch {
    tauriFailed = true;
    return null;
  }
}

export async function loadDocumentFromPath(
  filePath: string
): Promise<{ path: string; document: WriterDocument } | null> {
  const fs = await getFs();
  if (!fs) return null;

  try {
    const content = await fs.readTextFile(filePath);
    const document = JSON.parse(content) as WriterDocument;
    return { path: filePath, document };
  } catch {
    return null;
  }
}

async function scanDir(fs: FsModule, dir: string): Promise<DocumentListItem[]> {
  try {
    const entries = await fs.readDir(dir);
    const items: DocumentListItem[] = [];

    for (const entry of entries) {
      if (entry.name?.endsWith(".writer.json") && entry.isFile) {
        const filePath = `${dir}/${entry.name}`;
        try {
          const content = await fs.readTextFile(filePath);
          const doc = JSON.parse(content) as WriterDocument;
          items.push({ path: filePath, docId: doc.docId, title: doc.title });
        } catch {
          // skip unreadable files
        }
      }
    }

    return items;
  } catch {
    return [];
  }
}

export async function createNewDocument(): Promise<{
  path: string;
  document: WriterDocument;
} | null> {
  const fs = await getFs();
  if (!fs) return null;

  const { createDraftDocument } = await import("@cowrite/writer-core");
  const doc = createDraftDocument();
  const dir = SCAN_DIRS[0]; // writer-mcp directory
  const filePath = `${dir}/${doc.docId}.writer.json`;

  try {
    await fs.writeTextFile(filePath, JSON.stringify(doc, null, 2));
    return { path: filePath, document: doc };
  } catch {
    return null;
  }
}

export async function deleteDocument(filePath: string): Promise<boolean> {
  const fs = await getFs();
  if (!fs) return false;

  try {
    await fs.remove(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function saveDocument(
  filePath: string,
  document: WriterDocument
): Promise<boolean> {
  const fs = await getFs();
  if (!fs) return false;

  try {
    await fs.writeTextFile(filePath, JSON.stringify(document, null, 2));
    return true;
  } catch {
    return false;
  }
}

// Known paths where writer documents may exist
const SCAN_DIRS = [
  // MCP server working directory
  "/Users/ijaesang/Documents/Workspace/cowrite/packages/writer-mcp",
  // Project root
  "/Users/ijaesang/Documents/Workspace/cowrite",
];

export async function scanDocuments(): Promise<DocumentListItem[]> {
  const fs = await getFs();
  if (!fs) return [];

  const seen = new Set<string>();
  const all: DocumentListItem[] = [];

  for (const dir of SCAN_DIRS) {
    const items = await scanDir(fs, dir);
    for (const item of items) {
      if (!seen.has(item.docId)) {
        seen.add(item.docId);
        all.push(item);
      }
    }
  }

  return all;
}
