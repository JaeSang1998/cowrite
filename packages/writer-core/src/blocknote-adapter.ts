import { createBlock, createTextNode, nowIso } from "./document.js";
import { getBlockPlainText } from "./document.js";

import type {
  WriterBlock,
  WriterDocument,
  WriterTableRow,
  WriterTextMark
} from "./types.js";

export interface BlockNoteInlineContentLike {
  type: "text";
  text: string;
  styles?: Record<string, boolean | string>;
}

export interface BlockNoteTableContentLike {
  type: "tableContent";
  rows: Array<{
    cells: Array<BlockNoteInlineContentLike[]>;
  }>;
}

export interface BlockNoteBlockLike {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: BlockNoteInlineContentLike[] | BlockNoteTableContentLike | string;
  children?: BlockNoteBlockLike[];
}

const supportedEditorBlockTypes = new Set([
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "codeBlock",
  "table"
]);

function marksToStyles(
  marks: WriterTextMark[]
): Record<string, boolean | string> {
  return marks.reduce<Record<string, boolean | string>>((styles, mark) => {
    if (mark.type === "highlight") {
      styles.textColor =
        typeof mark.attrs?.color === "string" ? mark.attrs.color : "#ca8a04";
      return styles;
    }

    styles[mark.type] = true;
    return styles;
  }, {});
}

function stylesToMarks(
  styles?: Record<string, unknown>
): WriterTextMark[] {
  if (!styles) {
    return [];
  }

  return Object.entries(styles).flatMap(([key, value]) => {
    if (!value) {
      return [];
    }

    if (key === "textColor" && typeof value === "string") {
      return [{ type: "highlight", attrs: { color: value } }];
    }

    if (
      key === "bold" ||
      key === "italic" ||
      key === "underline" ||
      key === "strike"
    ) {
      return [{ type: key } as WriterTextMark];
    }

    return [];
  });
}

function writerTableToBlockNoteContent(
  rows: WriterTableRow[]
): BlockNoteTableContentLike {
  return {
    type: "tableContent",
    rows: rows.map((row) => ({
      cells: row.cells.map((cell) =>
        cell.content.map((node) => ({
          type: "text" as const,
          text: node.text,
          styles: marksToStyles(node.marks)
        }))
      )
    }))
  };
}

export function canonicalBlockToBlockNoteBlock(
  block: WriterBlock
): BlockNoteBlockLike {
  const editorType = supportedEditorBlockTypes.has(block.type)
    ? block.type
    : "paragraph";

  if (block.type === "table" && block.tableContent) {
    return {
      id: block.id,
      type: "table",
      content: writerTableToBlockNoteContent(block.tableContent),
      children: []
    };
  }

  return {
    id: block.id,
    type: editorType,
    props: {
      textAlignment: block.props.textAlign ?? "left",
      level: block.props.level,
      ...(block.props.checked !== undefined && { checked: block.props.checked }),
      ...(block.props.language !== undefined && { language: block.props.language })
    },
    content: getBlockPlainText(block),
    children: block.children.map(canonicalBlockToBlockNoteBlock)
  };
}

export function canonicalDocumentToBlockNote(
  document: WriterDocument
): BlockNoteBlockLike[] {
  return document.blocks.map(canonicalBlockToBlockNoteBlock);
}

function isTableContent(
  content: unknown
): content is BlockNoteTableContentLike {
  return (
    typeof content === "object" &&
    content !== null &&
    (content as Record<string, unknown>).type === "tableContent"
  );
}

function blockNoteTableToWriterRows(
  tableContent: BlockNoteTableContentLike
): WriterTableRow[] {
  return tableContent.rows.map((row) => ({
    cells: row.cells.map((cell) => ({
      content: cell.map((node) =>
        createTextNode(node.text, stylesToMarks(node.styles))
      )
    }))
  }));
}

const knownBlockTypes = new Set([
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "quote",
  "table",
  "checkListItem",
  "codeBlock"
]);

export function blockNoteBlockToCanonicalBlock(
  block: BlockNoteBlockLike
): WriterBlock {
  // Handle table blocks
  if (block.type === "table" && isTableContent(block.content)) {
    return {
      id: block.id ?? createBlock().id,
      type: "table",
      props: {},
      content: [],
      tableContent: blockNoteTableToWriterRows(block.content),
      children: []
    };
  }

  const textAlignment = block.props?.textAlignment;
  const level = block.props?.level;
  const checked = block.props?.checked;
  const language = block.props?.language;
  const content =
    typeof block.content === "string"
      ? [createTextNode(block.content)]
      : Array.isArray(block.content)
        ? block.content.map((node) =>
            createTextNode(node.text, stylesToMarks(node.styles))
          )
        : [createTextNode("")];
  const canonicalType = knownBlockTypes.has(block.type)
    ? (block.type as WriterBlock["type"])
    : "paragraph";

  return {
    id: block.id ?? createBlock().id,
    type: canonicalType,
    props: {
      textAlign:
        textAlignment === "center" || textAlignment === "right"
          ? (textAlignment as "center" | "right")
          : "left",
      level:
        level === 1 || level === 2 || level === 3
          ? (level as 1 | 2 | 3)
          : undefined,
      ...(typeof checked === "boolean" && { checked }),
      ...(typeof language === "string" && { language })
    },
    content,
    children: block.children?.map(blockNoteBlockToCanonicalBlock) ?? []
  };
}

export function blockNoteDocumentToCanonical(
  base: WriterDocument,
  blocks: BlockNoteBlockLike[]
): WriterDocument {
  return {
    ...base,
    blocks: blocks.map(blockNoteBlockToCanonicalBlock),
    metadata: {
      ...base.metadata,
      updatedAt: nowIso()
    }
  };
}
