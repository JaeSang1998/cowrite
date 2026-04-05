import { customAlphabet } from "nanoid";

import type {
  Annotation,
  DocumentVersion,
  Thread,
  ThreadComment,
  ThreadCommentRole,
  WriterBlock,
  WriterBlockProps,
  WriterDocument,
  WriterTextMark,
  WriterTextNode
} from "./types.js";

export const WRITER_SCHEMA_VERSION = 1 as const;

const createNanoId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export function createId(prefix: string): string {
  return `${prefix}_${createNanoId()}`;
}

export function nowIso(date = new Date()): string {
  return date.toISOString();
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createTextNode(
  text: string,
  marks: WriterTextMark[] = []
): WriterTextNode {
  return {
    type: "text",
    text,
    marks
  };
}

export function createBlock(options?: {
  id?: string;
  type?: WriterBlock["type"];
  text?: string;
  props?: WriterBlockProps;
  children?: WriterBlock[];
}): WriterBlock {
  return {
    id: options?.id ?? createId("blk"),
    type: options?.type ?? "paragraph",
    props: options?.props ?? { textAlign: "left" },
    content: [createTextNode(options?.text ?? "")],
    children: options?.children ?? []
  };
}

export function getBlockPlainText(block: WriterBlock): string {
  return block.content.map((node) => node.text).join("");
}

export function replaceBlockPlainText(
  block: WriterBlock,
  text: string
): WriterBlock {
  return {
    ...block,
    content: [createTextNode(text)]
  };
}

export interface BlockReplacement {
  blockId: string;
  text: string;
}

export function replaceBlocks(
  document: WriterDocument,
  replacements: BlockReplacement[],
  reason: string
): WriterDocument {
  for (const r of replacements) {
    if (!findBlockById(document.blocks, r.blockId)) {
      throw new Error(`Block "${r.blockId}" not found.`);
    }
  }

  let blocks = deepClone(document.blocks);
  for (const r of replacements) {
    blocks = mapBlocks(blocks, r.blockId, (b) => replaceBlockPlainText(b, r.text));
  }

  const replaced = new Set(replacements.map((r) => r.blockId));
  const annotations = document.annotations.filter((a) => !replaced.has(a.anchor.blockId));
  const threadIds = new Set(annotations.map((a) => a.threadId).filter(Boolean));
  const threads = document.threads.filter((t) => threadIds.has(t.id));

  const count = replacements.length;
  return {
    ...document,
    blocks,
    annotations,
    threads,
    versions: [
      ...document.versions,
      createDocumentVersion(`${reason} (${count} block${count > 1 ? "s" : ""})`, "assistant"),
    ],
    metadata: { ...document.metadata, updatedAt: nowIso() },
  };
}

export interface BlockInsert {
  referenceBlockId: string;
  position: "before" | "after";
  blocks: { type?: WriterBlock["type"]; text: string; props?: WriterBlockProps }[];
}

export function insertBlocks(
  document: WriterDocument,
  insert: BlockInsert,
  reason: string
): WriterDocument {
  if (!findBlockById(document.blocks, insert.referenceBlockId)) {
    throw new Error(`Block "${insert.referenceBlockId}" not found.`);
  }

  const newBlocks = insert.blocks.map((b) =>
    createBlock({ type: b.type, text: b.text, props: b.props })
  );

  const blocks = deepClone(document.blocks);
  const result: WriterBlock[] = [];
  for (const block of blocks) {
    if (block.id === insert.referenceBlockId) {
      if (insert.position === "before") {
        result.push(...newBlocks, block);
      } else {
        result.push(block, ...newBlocks);
      }
    } else {
      result.push(block);
    }
  }

  return {
    ...document,
    blocks: result,
    versions: [
      ...document.versions,
      createDocumentVersion(`${reason} (${newBlocks.length} block${newBlocks.length > 1 ? "s" : ""} inserted)`, "assistant"),
    ],
    metadata: { ...document.metadata, updatedAt: nowIso() },
  };
}

export function deleteBlocks(
  document: WriterDocument,
  blockIds: string[],
  reason: string
): WriterDocument {
  for (const id of blockIds) {
    if (!findBlockById(document.blocks, id)) {
      throw new Error(`Block "${id}" not found.`);
    }
  }

  const toDelete = new Set(blockIds);
  const blocks = deepClone(document.blocks).filter((b) => !toDelete.has(b.id));

  const annotations = document.annotations.filter((a) => !toDelete.has(a.anchor.blockId));
  const threadIds = new Set(annotations.map((a) => a.threadId).filter(Boolean));
  const threads = document.threads.filter((t) => threadIds.has(t.id));

  const count = blockIds.length;
  return {
    ...document,
    blocks,
    annotations,
    threads,
    versions: [
      ...document.versions,
      createDocumentVersion(`${reason} (${count} block${count > 1 ? "s" : ""} deleted)`, "assistant"),
    ],
    metadata: { ...document.metadata, updatedAt: nowIso() },
  };
}

export function mapBlocks(
  blocks: WriterBlock[],
  blockId: string,
  updater: (block: WriterBlock) => WriterBlock
): WriterBlock[] {
  return blocks.map((block) => {
    if (block.id === blockId) {
      return updater(block);
    }

    if (block.children.length === 0) {
      return block;
    }

    return {
      ...block,
      children: mapBlocks(block.children, blockId, updater)
    };
  });
}

export function findBlockById(
  blocks: WriterBlock[],
  blockId: string
): WriterBlock | undefined {
  for (const block of blocks) {
    if (block.id === blockId) {
      return block;
    }

    const nestedMatch = findBlockById(block.children, blockId);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return undefined;
}

export function createDocumentVersion(
  note: string,
  author: ThreadCommentRole,
  patchId?: string,
  snapshotRef?: string
): DocumentVersion {
  return {
    id: createId("ver"),
    createdAt: nowIso(),
    note,
    author,
    patchId,
    snapshotRef
  };
}

export function createEmptyDocument(options?: {
  title?: string;
  activePersonaId?: string | null;
}): WriterDocument {
  const timestamp = nowIso();

  return {
    schemaVersion: WRITER_SCHEMA_VERSION,
    docId: createId("doc"),
    title: options?.title ?? "Untitled",
    activePersonaId: options?.activePersonaId ?? null,
    blocks: [],
    annotations: [],
    threads: [],
    versions: [
      createDocumentVersion("Document created", "system")
    ],
    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: []
    }
  };
}

export function createDraftDocument(options?: {
  title?: string;
  activePersonaId?: string | null;
}): WriterDocument {
  const document = createEmptyDocument({
    title: options?.title ?? "Untitled",
    activePersonaId: options?.activePersonaId
  });

  return {
    ...document,
    blocks: [
      createBlock({
        id: "blk_new",
        text: ""
      })
    ]
  };
}

export function touchDocument(
  document: WriterDocument,
  note?: string,
  author: ThreadCommentRole = "system"
): WriterDocument {
  return {
    ...document,
    versions: note
      ? [...document.versions, createDocumentVersion(note, author)]
      : document.versions,
    metadata: {
      ...document.metadata,
      updatedAt: nowIso()
    }
  };
}

/* ── Thread / Annotation helpers ── */

export interface AddCommentInput {
  blockId: string;
  start: number;
  end: number;
  quote: string;
  body: string;
  authorId: string;
  role: ThreadCommentRole;
}

/**
 * Add a comment to a document, creating a new annotation + thread,
 * or appending to an existing thread if one exists for the same anchor.
 * Returns the updated document plus the ids of the created entities.
 */
export function addCommentToDocument(
  document: WriterDocument,
  input: AddCommentInput
): {
  document: WriterDocument;
  annotationId: string;
  threadId: string;
  commentId: string;
} {
  const now = nowIso();
  const commentId = createId("cmt");
  const comment: ThreadComment = {
    id: commentId,
    authorId: input.authorId,
    role: input.role,
    body: input.body,
    createdAt: now
  };

  // Check for existing annotation on the same anchor
  const existingAnnotation = document.annotations.find(
    (a) =>
      a.anchor.blockId === input.blockId &&
      a.anchor.start === input.start &&
      a.anchor.end === input.end
  );

  if (existingAnnotation?.threadId) {
    const threadId = existingAnnotation.threadId;
    return {
      document: {
        ...document,
        threads: document.threads.map((t) =>
          t.id === threadId
            ? { ...t, comments: [...t.comments, comment] }
            : t
        ),
        metadata: { ...document.metadata, updatedAt: now }
      },
      annotationId: existingAnnotation.id,
      threadId,
      commentId
    };
  }

  const annotationId = createId("ann");
  const threadId = createId("thread");

  const annotation: Annotation = {
    id: annotationId,
    kind: "selection",
    anchor: {
      blockId: input.blockId,
      start: input.start,
      end: input.end,
      quote: input.quote
    },
    threadId,
    createdAt: now
  };

  const thread: Thread = {
    id: threadId,
    annotationId,
    resolved: false,
    comments: [comment]
  };

  return {
    document: {
      ...document,
      annotations: [...document.annotations, annotation],
      threads: [...document.threads, thread],
      metadata: { ...document.metadata, updatedAt: now }
    },
    annotationId,
    threadId,
    commentId
  };
}

export function exportDocumentAsMarkdown(document: WriterDocument): string {
  return document.blocks
    .map((block) => {
      const text = getBlockPlainText(block);

      switch (block.type) {
        case "heading":
          return `${"#".repeat(block.props.level ?? 1)} ${text}`;
        case "quote":
          return `> ${text}`;
        case "bulletListItem":
          return `- ${text}`;
        case "numberedListItem":
          return `1. ${text}`;
        case "paragraph":
        default:
          return text;
      }
    })
    .join("\n\n");
}

