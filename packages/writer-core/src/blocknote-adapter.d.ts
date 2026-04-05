import type { WriterBlock, WriterDocument } from "./types.js";
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
export declare function canonicalBlockToBlockNoteBlock(block: WriterBlock): BlockNoteBlockLike;
export declare function canonicalDocumentToBlockNote(document: WriterDocument): BlockNoteBlockLike[];
export declare function blockNoteBlockToCanonicalBlock(block: BlockNoteBlockLike): WriterBlock;
export declare function blockNoteDocumentToCanonical(base: WriterDocument, blocks: BlockNoteBlockLike[]): WriterDocument;
//# sourceMappingURL=blocknote-adapter.d.ts.map