import { useEffect, useRef } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { loadDocumentFromPath, scanDocuments } from "@/lib/documents";

type FsModule = typeof import("@tauri-apps/plugin-fs");

/**
 * Watches the current document file for external changes (e.g. MCP writes).
 * Uses Tauri fs.watchImmediate when available, falls back to polling.
 *
 * Only reloads when the file content differs from the LAST KNOWN state,
 * ignoring changes caused by our own loadDocument calls.
 */
export function useDocumentWatcher() {
  const documentPath = useDocumentStore((s) => s.documentPath);
  const loadDocument = useDocumentStore((s) => s.loadDocument);
  const setDocumentList = useDocumentStore((s) => s.setDocumentList);

  const lastJsonRef = useRef<string>("");
  const isReloading = useRef(false);

  useEffect(() => {
    if (!documentPath) return;

    const currentDoc = useDocumentStore.getState().document;
    lastJsonRef.current = JSON.stringify(currentDoc);

    let cleanup: (() => void) | null = null;

    const currentDocId = useDocumentStore.getState().document.docId;

    const reload = async () => {
      if (isReloading.current) return;
      isReloading.current = true;

      try {
        const storeDocId = useDocumentStore.getState().document.docId;
        if (storeDocId !== currentDocId) return;

        const entry = await loadDocumentFromPath(documentPath);
        if (!entry) return;

        const json = JSON.stringify(entry.document);
        if (json !== lastJsonRef.current) {
          lastJsonRef.current = json;
          // External file change — update document data without resetting BlockNote canvas
          loadDocument(entry.document, documentPath, { resetCanvas: false });

          const docs = await scanDocuments();
          setDocumentList(docs);
        }
      } finally {
        isReloading.current = false;
      }
    };

    (async () => {
      try {
        const fs: FsModule = await import("@tauri-apps/plugin-fs");
        if (fs.watchImmediate) {
          const unwatch = await fs.watchImmediate(
            documentPath,
            () => reload(),
            { recursive: false }
          );
          cleanup = () => unwatch();
          return;
        }
      } catch {
        // Not in Tauri environment
      }

      const interval = setInterval(reload, 1500);
      cleanup = () => clearInterval(interval);
    })();

    return () => {
      cleanup?.();
    };
  }, [documentPath, loadDocument, setDocumentList]);
}
