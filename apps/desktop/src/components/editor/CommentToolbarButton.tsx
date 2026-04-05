import { useCallback } from "react";
import {
  useBlockNoteEditor,
  FormattingToolbarController,
  FormattingToolbar,
  getFormattingToolbarItems,
  useComponentsContext,
} from "@blocknote/react";
import { MessageSquare } from "lucide-react";
import { useThreadStore } from "@/store/threadStore";

function CommentButton() {
  const editor = useBlockNoteEditor();
  const components = useComponentsContext();
  const startComment = useThreadStore((s) => s.startComment);

  const handleClick = useCallback(() => {
    const pmView = (editor as any)._tiptapEditor?.view;
    if (!pmView) return;

    const { from, to } = pmView.state.selection;
    if (from === to) return;

    // Capture everything synchronously before BlockNote processes the click
    const selectedText = pmView.state.doc.textBetween(from, to, "");
    if (!selectedText.trim()) return;

    const cursor = editor.getTextCursorPosition();
    const block = cursor.block;
    if (!block) return;

    const blockId = block.id;
    const fullText = extractBlockPlainText(block);

    const idx = fullText.indexOf(selectedText);
    const start = idx !== -1 ? idx : 0;
    const end = idx !== -1 ? idx + selectedText.length : fullText.length;

    const endCoords = pmView.coordsAtPos(to);
    const rect = {
      top: endCoords.top,
      left: endCoords.left,
      bottom: endCoords.bottom,
      width: 200,
    };

    // Defer state update so BlockNote finishes its toolbar teardown first
    setTimeout(() => {
      startComment(blockId, start, end, selectedText, rect);
    }, 0);
  }, [editor, startComment]);

  if (!components) return null;

  return (
    <components.FormattingToolbar.Button
      className="bn-button"
      label="댓글 추가"
      mainTooltip="댓글 추가"
      isSelected={false}
      onClick={handleClick}
      icon={<MessageSquare size={16} />}
    />
  );
}

function extractBlockPlainText(block: any): string {
  if (!block.content) return "";
  if (typeof block.content === "string") return block.content;
  if (Array.isArray(block.content)) {
    return block.content
      .map((node: any) => {
        if (typeof node === "string") return node;
        if (node.type === "text") return node.text ?? "";
        if (node.type === "link") {
          return (node.content ?? [])
            .map((c: any) => c.text ?? "")
            .join("");
        }
        return "";
      })
      .join("");
  }
  return "";
}

function CustomFormattingToolbar() {
  return (
    <FormattingToolbar>
      {...getFormattingToolbarItems()}
      <CommentButton key="commentButton" />
    </FormattingToolbar>
  );
}

export function CommentFormattingToolbar() {
  return (
    <FormattingToolbarController formattingToolbar={CustomFormattingToolbar} />
  );
}
