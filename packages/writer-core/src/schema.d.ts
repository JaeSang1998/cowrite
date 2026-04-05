import { z } from "zod";
import type { Annotation, DocumentVersion, PatchProposal, PersonasFile, PreferenceProfile, PreferenceSignal, Thread, ThreadComment, WriterBlock, WriterDocument, WriterTextMark, WriterTextNode } from "./types.js";
export declare const isoDateStringSchema: z.ZodUnion<[z.ZodString, z.ZodString]>;
export declare const writerTextMarkSchema: z.ZodType<WriterTextMark>;
export declare const writerTextNodeSchema: z.ZodType<WriterTextNode>;
export declare const writerTableCellSchema: z.ZodObject<{
    content: z.ZodArray<z.ZodType<WriterTextNode, z.ZodTypeDef, WriterTextNode>, "many">;
}, "strip", z.ZodTypeAny, {
    content: WriterTextNode[];
}, {
    content: WriterTextNode[];
}>;
export declare const writerTableRowSchema: z.ZodObject<{
    cells: z.ZodArray<z.ZodObject<{
        content: z.ZodArray<z.ZodType<WriterTextNode, z.ZodTypeDef, WriterTextNode>, "many">;
    }, "strip", z.ZodTypeAny, {
        content: WriterTextNode[];
    }, {
        content: WriterTextNode[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    cells: {
        content: WriterTextNode[];
    }[];
}, {
    cells: {
        content: WriterTextNode[];
    }[];
}>;
export declare const writerBlockSchema: z.ZodType<WriterBlock>;
export declare const annotationSchema: z.ZodType<Annotation>;
export declare const threadCommentSchema: z.ZodType<ThreadComment>;
export declare const threadSchema: z.ZodType<Thread>;
export declare const patchProposalSchema: z.ZodType<PatchProposal>;
export declare const documentVersionSchema: z.ZodType<DocumentVersion>;
export declare const writerDocumentSchema: z.ZodType<WriterDocument>;
export declare const styleExampleSchema: z.ZodObject<{
    id: z.ZodString;
    before: z.ZodString;
    after: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    before: string;
    after: string;
    note?: string | undefined;
}, {
    id: string;
    createdAt: string;
    before: string;
    after: string;
    note?: string | undefined;
}>;
export declare const personaSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    hardRules: z.ZodArray<z.ZodString, "many">;
    likedPhrases: z.ZodArray<z.ZodString, "many">;
    dislikedPhrases: z.ZodArray<z.ZodString, "many">;
    defaultForDocTypes: z.ZodArray<z.ZodString, "many">;
    voice: z.ZodObject<{
        brevity: z.ZodNumber;
        warmth: z.ZodNumber;
        directness: z.ZodNumber;
        softness: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        brevity: number;
        warmth: number;
        directness: number;
        softness: number;
    }, {
        brevity: number;
        warmth: number;
        directness: number;
        softness: number;
    }>;
    styleExamples: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        before: z.ZodString;
        after: z.ZodString;
        note: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        before: string;
        after: string;
        note?: string | undefined;
    }, {
        id: string;
        createdAt: string;
        before: string;
        after: string;
        note?: string | undefined;
    }>, "many">>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    hardRules: string[];
    likedPhrases: string[];
    dislikedPhrases: string[];
    defaultForDocTypes: string[];
    voice: {
        brevity: number;
        warmth: number;
        directness: number;
        softness: number;
    };
    styleExamples: {
        id: string;
        createdAt: string;
        before: string;
        after: string;
        note?: string | undefined;
    }[];
    createdAt: string;
    updatedAt: string;
}, {
    id: string;
    name: string;
    description: string;
    hardRules: string[];
    likedPhrases: string[];
    dislikedPhrases: string[];
    defaultForDocTypes: string[];
    voice: {
        brevity: number;
        warmth: number;
        directness: number;
        softness: number;
    };
    createdAt: string;
    updatedAt: string;
    styleExamples?: {
        id: string;
        createdAt: string;
        before: string;
        after: string;
        note?: string | undefined;
    }[] | undefined;
}>;
export declare const personasFileSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
    personas: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        hardRules: z.ZodArray<z.ZodString, "many">;
        likedPhrases: z.ZodArray<z.ZodString, "many">;
        dislikedPhrases: z.ZodArray<z.ZodString, "many">;
        defaultForDocTypes: z.ZodArray<z.ZodString, "many">;
        voice: z.ZodObject<{
            brevity: z.ZodNumber;
            warmth: z.ZodNumber;
            directness: z.ZodNumber;
            softness: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            brevity: number;
            warmth: number;
            directness: number;
            softness: number;
        }, {
            brevity: number;
            warmth: number;
            directness: number;
            softness: number;
        }>;
        styleExamples: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            before: z.ZodString;
            after: z.ZodString;
            note: z.ZodOptional<z.ZodString>;
            createdAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            createdAt: string;
            before: string;
            after: string;
            note?: string | undefined;
        }, {
            id: string;
            createdAt: string;
            before: string;
            after: string;
            note?: string | undefined;
        }>, "many">>;
        createdAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
        updatedAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        hardRules: string[];
        likedPhrases: string[];
        dislikedPhrases: string[];
        defaultForDocTypes: string[];
        voice: {
            brevity: number;
            warmth: number;
            directness: number;
            softness: number;
        };
        styleExamples: {
            id: string;
            createdAt: string;
            before: string;
            after: string;
            note?: string | undefined;
        }[];
        createdAt: string;
        updatedAt: string;
    }, {
        id: string;
        name: string;
        description: string;
        hardRules: string[];
        likedPhrases: string[];
        dislikedPhrases: string[];
        defaultForDocTypes: string[];
        voice: {
            brevity: number;
            warmth: number;
            directness: number;
            softness: number;
        };
        createdAt: string;
        updatedAt: string;
        styleExamples?: {
            id: string;
            createdAt: string;
            before: string;
            after: string;
            note?: string | undefined;
        }[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    updatedAt: string;
    schemaVersion: 1;
    personas: {
        id: string;
        name: string;
        description: string;
        hardRules: string[];
        likedPhrases: string[];
        dislikedPhrases: string[];
        defaultForDocTypes: string[];
        voice: {
            brevity: number;
            warmth: number;
            directness: number;
            softness: number;
        };
        styleExamples: {
            id: string;
            createdAt: string;
            before: string;
            after: string;
            note?: string | undefined;
        }[];
        createdAt: string;
        updatedAt: string;
    }[];
}, {
    updatedAt: string;
    schemaVersion: 1;
    personas: {
        id: string;
        name: string;
        description: string;
        hardRules: string[];
        likedPhrases: string[];
        dislikedPhrases: string[];
        defaultForDocTypes: string[];
        voice: {
            brevity: number;
            warmth: number;
            directness: number;
            softness: number;
        };
        createdAt: string;
        updatedAt: string;
        styleExamples?: {
            id: string;
            createdAt: string;
            before: string;
            after: string;
            note?: string | undefined;
        }[] | undefined;
    }[];
}>;
export declare const preferenceSignalSchema: z.ZodType<PreferenceSignal>;
export declare const preferenceProfileSchema: z.ZodType<PreferenceProfile>;
export declare function parseWriterDocument(input: unknown): WriterDocument;
export declare function parsePersonasFile(input: unknown): PersonasFile;
export declare function parsePreferenceProfile(input: unknown): PreferenceProfile;
//# sourceMappingURL=schema.d.ts.map