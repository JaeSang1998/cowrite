import type { DocumentVersion, ThreadCommentRole, WriterBlock, WriterBlockProps, WriterDocument, WriterTextMark, WriterTextNode } from "./types.js";
export declare const WRITER_SCHEMA_VERSION: 1;
export declare function createId(prefix: string): string;
export declare function nowIso(date?: Date): string;
export declare function deepClone<T>(value: T): T;
export declare function createTextNode(text: string, marks?: WriterTextMark[]): WriterTextNode;
export declare function createBlock(options?: {
    id?: string;
    type?: WriterBlock["type"];
    text?: string;
    props?: WriterBlockProps;
    children?: WriterBlock[];
}): WriterBlock;
export declare function getBlockPlainText(block: WriterBlock): string;
export declare function replaceBlockPlainText(block: WriterBlock, text: string): WriterBlock;
export interface BlockReplacement {
    blockId: string;
    text: string;
}
export declare function replaceBlocks(document: WriterDocument, replacements: BlockReplacement[], reason: string): WriterDocument;
export declare function mapBlocks(blocks: WriterBlock[], blockId: string, updater: (block: WriterBlock) => WriterBlock): WriterBlock[];
export declare function findBlockById(blocks: WriterBlock[], blockId: string): WriterBlock | undefined;
export declare function createDocumentVersion(note: string, author: ThreadCommentRole, patchId?: string, snapshotRef?: string): DocumentVersion;
export declare function createEmptyDocument(options?: {
    title?: string;
    activePersonaId?: string | null;
}): WriterDocument;
export declare function createDraftDocument(options?: {
    title?: string;
    activePersonaId?: string | null;
}): WriterDocument;
export declare function touchDocument(document: WriterDocument, note?: string, author?: ThreadCommentRole): WriterDocument;
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
export declare function addCommentToDocument(document: WriterDocument, input: AddCommentInput): {
    document: WriterDocument;
    annotationId: string;
    threadId: string;
    commentId: string;
};
export declare function exportDocumentAsMarkdown(document: WriterDocument): string;
//# sourceMappingURL=document.d.ts.map