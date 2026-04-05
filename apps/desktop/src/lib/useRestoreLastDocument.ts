import { useEffect, useRef } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { loadDocumentFromPath, scanDocuments } from "@/lib/documents";

const STORAGE_KEY = "cowrite:lastDocumentPath";
const ACTIVE_DOC_PATH = "/Users/ijaesang/.writer/active-doc.json";

/**
 * Persists the current document path to localStorage (and active-doc.json
 * so the MCP server can pick up which document is currently open),
 * and restores it on app startup.
 */
export function useRestoreLastDocument() {
  const documentPath = useDocumentStore((s) => s.documentPath);
  const loadDocument = useDocumentStore((s) => s.loadDocument);
  const setDocumentList = useDocumentStore((s) => s.setDocumentList);
  const hasRestored = useRef(false);

  // Save current path whenever it changes
  useEffect(() => {
    if (documentPath) {
      localStorage.setItem(STORAGE_KEY, documentPath);

      // Write to ~/.writer/active-doc.json for MCP server
      (async () => {
        try {
          const fs = await import("@tauri-apps/plugin-fs");
          await fs.writeTextFile(
            ACTIVE_DOC_PATH,
            JSON.stringify({ path: documentPath }) + "\n"
          );
        } catch {
          // Not in Tauri environment
        }
      })();
    }
  }, [documentPath]);

  // Restore on mount (once)
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    // Don't restore if a document is already loaded
    if (useDocumentStore.getState().documentPath) return;

    const savedPath = localStorage.getItem(STORAGE_KEY);
    if (!savedPath) return;

    (async () => {
      const entry = await loadDocumentFromPath(savedPath);
      if (entry) {
        loadDocument(entry.document, entry.path);
      }
      const docs = await scanDocuments();
      setDocumentList(docs);
    })();
  }, [loadDocument, setDocumentList]);
}
