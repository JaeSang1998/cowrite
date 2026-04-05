import { useEffect, useRef } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { saveDocument } from "@/lib/documents";

/**
 * Auto-saves the document to disk whenever it changes.
 * Debounced to avoid excessive writes.
 */
export function useAutoSave(debounceMs = 500) {
  const document = useDocumentStore((s) => s.document);
  const documentPath = useDocumentStore((s) => s.documentPath);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!documentPath) return;

    const json = JSON.stringify(document);

    // Skip if nothing changed
    if (json === lastSavedRef.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const success = await saveDocument(documentPath, document);
      if (success) {
        lastSavedRef.current = json;
      }
    }, debounceMs);

    return () => clearTimeout(timerRef.current);
  }, [document, documentPath, debounceMs]);
}
