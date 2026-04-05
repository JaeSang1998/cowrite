export type ISODateString = string;
export type TextAlign = "left" | "center" | "right";
export type WriterBlockType = "paragraph" | "heading" | "bulletListItem" | "numberedListItem" | "quote" | "table" | "checkListItem" | "codeBlock";
export type WriterMarkType = "bold" | "italic" | "underline" | "strike" | "highlight";
export type AnnotationKind = "highlight" | "selection";
export type ThreadCommentRole = "user" | "assistant" | "system";
export type PatchOperation = "replace_text";
export type PatchStatus = "pending" | "accepted" | "rejected";
export type FeedbackOutcome = "accepted" | "rejected" | "edited";
export interface WriterTextMark {
    type: WriterMarkType;
    attrs?: Record<string, string | number | boolean>;
}
export interface WriterTextNode {
    type: "text";
    text: string;
    marks: WriterTextMark[];
}
export interface WriterBlockProps {
    textAlign?: TextAlign;
    level?: 1 | 2 | 3;
    tone?: string;
    checked?: boolean;
    language?: string;
}
export interface WriterTableCell {
    content: WriterTextNode[];
}
export interface WriterTableRow {
    cells: WriterTableCell[];
}
export interface WriterBlock {
    id: string;
    type: WriterBlockType;
    props: WriterBlockProps;
    content: WriterTextNode[];
    tableContent?: WriterTableRow[];
    children: WriterBlock[];
}
export interface AnnotationAnchor {
    blockId: string;
    start: number;
    end: number;
    quote: string;
}
export interface Annotation {
    id: string;
    kind: AnnotationKind;
    anchor: AnnotationAnchor;
    threadId?: string;
    createdAt: ISODateString;
}
export interface ThreadComment {
    id: string;
    authorId: string;
    role: ThreadCommentRole;
    body: string;
    parentId?: string;
    createdAt: ISODateString;
    updatedAt?: ISODateString;
}
export interface Thread {
    id: string;
    annotationId?: string;
    resolved: boolean;
    comments: ThreadComment[];
}
export interface PatchTargetRange {
    type: "range";
    blockId: string;
    start: number;
    end: number;
    quote?: string;
}
export interface PatchProposal {
    patchId: string;
    docId: string;
    target: PatchTargetRange;
    operation: PatchOperation;
    before: string;
    after: string;
    reason: string;
    instruction?: string;
    status: PatchStatus;
    createdBy: string;
    createdAt: ISODateString;
}
export interface DocumentVersion {
    id: string;
    createdAt: ISODateString;
    note: string;
    author: ThreadCommentRole;
    patchId?: string;
    snapshotRef?: string;
}
export interface WriterDocumentMetadata {
    createdAt: ISODateString;
    updatedAt: ISODateString;
    tags: string[];
    archived?: boolean;
}
export interface WriterDocument {
    schemaVersion: 1;
    docId: string;
    title: string;
    activePersonaId: string | null;
    blocks: WriterBlock[];
    annotations: Annotation[];
    threads: Thread[];
    versions: DocumentVersion[];
    metadata: WriterDocumentMetadata;
}
export interface PersonaVoiceProfile {
    brevity: number;
    warmth: number;
    directness: number;
    softness: number;
}
export interface StyleExample {
    id: string;
    before: string;
    after: string;
    note?: string;
    createdAt: ISODateString;
}
export interface Persona {
    id: string;
    name: string;
    description: string;
    hardRules: string[];
    likedPhrases: string[];
    dislikedPhrases: string[];
    defaultForDocTypes: string[];
    voice: PersonaVoiceProfile;
    styleExamples: StyleExample[];
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
export interface PersonasFile {
    schemaVersion: 1;
    updatedAt: ISODateString;
    personas: Persona[];
}
export interface PreferenceSignal {
    id: string;
    pattern: string;
    direction: "prefer" | "avoid";
    weight: number;
    evidenceCount: number;
}
export interface PreferenceFeedback {
    id: string;
    patchId?: string;
    instruction?: string;
    outcome: FeedbackOutcome;
    note?: string;
    createdAt: ISODateString;
}
export interface PreferenceProfile {
    schemaVersion: 1;
    userId: string;
    updatedAt: ISODateString;
    signals: PreferenceSignal[];
    recentFeedback: PreferenceFeedback[];
}
export interface PatchPreview {
    patch: PatchProposal;
    blockId: string;
    beforeText: string;
    afterText: string;
    changedSpan: {
        start: number;
        before: string;
        after: string;
    };
}
export interface CreatePatchInput {
    docId: string;
    blockId: string;
    start: number;
    end: number;
    after: string;
    reason: string;
    instruction?: string;
    createdBy?: string;
}
//# sourceMappingURL=types.d.ts.map