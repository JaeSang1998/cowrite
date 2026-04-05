import type { BlockNoteEditor } from "@blocknote/core";

/**
 * Typed access to BlockNote's internal TipTap editor.
 * All unsafe casts are isolated here — if BlockNote exposes a public API,
 * fix it in this one file.
 */

export function getTiptapEditor(editor: BlockNoteEditor): any | null {
  return (editor as any)._tiptapEditor ?? null;
}

export function getTiptapView(editor: BlockNoteEditor): any | null {
  return getTiptapEditor(editor)?.view ?? null;
}
