import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  canonicalDocumentToBlockNote,
  type BlockNoteBlockLike,
} from "@cowrite/writer-core";
import { BlockDragHandle } from "./BlockDragHandle";
import { CommentFormattingToolbar } from "./CommentToolbarButton";
import { FindReplaceBar } from "./FindReplaceBar";

interface WriterCanvasProps {
  documentBlocks: ReturnType<typeof canonicalDocumentToBlockNote>;
  onBlocksChange: (blocks: BlockNoteBlockLike[]) => void;
}

export function WriterCanvas({ documentBlocks, onBlocksChange }: WriterCanvasProps) {
  const editor = useCreateBlockNote({
    initialContent: documentBlocks as never[],
  });

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      emojiPicker={false}
      filePanel={false}
      tableHandles={false}
      sideMenu={false}
      formattingToolbar={false}

      onChange={() =>
        onBlocksChange(editor.document as unknown as BlockNoteBlockLike[])
      }
    >
      <BlockDragHandle />
      <CommentFormattingToolbar />
      <FindReplaceBar />
    </BlockNoteView>
  );
}
