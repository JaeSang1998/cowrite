import { customAlphabet } from "nanoid";
export const WRITER_SCHEMA_VERSION = 1;
const createNanoId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);
export function createId(prefix) {
    return `${prefix}_${createNanoId()}`;
}
export function nowIso(date = new Date()) {
    return date.toISOString();
}
export function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}
export function createTextNode(text, marks = []) {
    return {
        type: "text",
        text,
        marks
    };
}
export function createBlock(options) {
    return {
        id: options?.id ?? createId("blk"),
        type: options?.type ?? "paragraph",
        props: options?.props ?? { textAlign: "left" },
        content: [createTextNode(options?.text ?? "")],
        children: options?.children ?? []
    };
}
export function getBlockPlainText(block) {
    return block.content.map((node) => node.text).join("");
}
export function replaceBlockPlainText(block, text) {
    return {
        ...block,
        content: [createTextNode(text)]
    };
}
export function replaceBlocks(document, replacements, reason) {
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
export function mapBlocks(blocks, blockId, updater) {
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
export function findBlockById(blocks, blockId) {
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
export function createDocumentVersion(note, author, patchId, snapshotRef) {
    return {
        id: createId("ver"),
        createdAt: nowIso(),
        note,
        author,
        patchId,
        snapshotRef
    };
}
export function createEmptyDocument(options) {
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
export function createDraftDocument(options) {
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
export function touchDocument(document, note, author = "system") {
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
/**
 * Add a comment to a document, creating a new annotation + thread,
 * or appending to an existing thread if one exists for the same anchor.
 * Returns the updated document plus the ids of the created entities.
 */
export function addCommentToDocument(document, input) {
    const now = nowIso();
    const commentId = createId("cmt");
    const comment = {
        id: commentId,
        authorId: input.authorId,
        role: input.role,
        body: input.body,
        createdAt: now
    };
    // Check for existing annotation on the same anchor
    const existingAnnotation = document.annotations.find((a) => a.anchor.blockId === input.blockId &&
        a.anchor.start === input.start &&
        a.anchor.end === input.end);
    if (existingAnnotation?.threadId) {
        const threadId = existingAnnotation.threadId;
        return {
            document: {
                ...document,
                threads: document.threads.map((t) => t.id === threadId
                    ? { ...t, comments: [...t.comments, comment] }
                    : t),
                metadata: { ...document.metadata, updatedAt: now }
            },
            annotationId: existingAnnotation.id,
            threadId,
            commentId
        };
    }
    const annotationId = createId("ann");
    const threadId = createId("thread");
    const annotation = {
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
    const thread = {
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
export function exportDocumentAsMarkdown(document) {
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
//# sourceMappingURL=document.js.map