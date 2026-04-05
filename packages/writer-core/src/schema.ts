import { z } from "zod";

import type {
  Annotation,
  DocumentVersion,
  PatchProposal,
  Persona,
  PersonasFile,
  PreferenceProfile,
  PreferenceSignal,
  Thread,
  ThreadComment,
  WriterBlock,
  WriterDocument,
  WriterTextMark,
  WriterTextNode
} from "./types.js";

const scalarAttrsSchema = z.record(
  z.union([z.string(), z.number(), z.boolean()])
);

export const isoDateStringSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime());

export const writerTextMarkSchema: z.ZodType<WriterTextMark> = z.object({
  type: z.enum(["bold", "italic", "underline", "strike", "highlight"]),
  attrs: scalarAttrsSchema.optional()
});

export const writerTextNodeSchema: z.ZodType<WriterTextNode> = z.object({
  type: z.literal("text"),
  text: z.string(),
  marks: z.array(writerTextMarkSchema)
});

export const writerTableCellSchema = z.object({
  content: z.array(writerTextNodeSchema)
});

export const writerTableRowSchema = z.object({
  cells: z.array(writerTableCellSchema)
});

export const writerBlockSchema: z.ZodType<WriterBlock> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.enum([
      "paragraph",
      "heading",
      "bulletListItem",
      "numberedListItem",
      "quote",
      "table",
      "checkListItem",
      "codeBlock"
    ]),
    props: z.object({
      textAlign: z.enum(["left", "center", "right"]).optional(),
      level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      tone: z.string().optional(),
      checked: z.boolean().optional(),
      language: z.string().optional()
    }),
    content: z.array(writerTextNodeSchema),
    tableContent: z.array(writerTableRowSchema).optional(),
    children: z.array(writerBlockSchema)
  })
);

export const annotationSchema: z.ZodType<Annotation> = z.object({
  id: z.string().min(1),
  kind: z.enum(["highlight", "selection"]),
  anchor: z.object({
    blockId: z.string().min(1),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
    quote: z.string()
  }),
  threadId: z.string().min(1).optional(),
  createdAt: isoDateStringSchema
});

export const threadCommentSchema: z.ZodType<ThreadComment> = z.object({
  id: z.string().min(1),
  authorId: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  body: z.string().min(1),
  parentId: z.string().min(1).optional(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema.optional()
});

export const threadSchema: z.ZodType<Thread> = z.object({
  id: z.string().min(1),
  annotationId: z.string().min(1).optional(),
  resolved: z.boolean(),
  comments: z.array(threadCommentSchema)
});

export const patchProposalSchema: z.ZodType<PatchProposal> = z.object({
  patchId: z.string().min(1),
  docId: z.string().min(1),
  target: z.object({
    type: z.literal("range"),
    blockId: z.string().min(1),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
    quote: z.string().optional()
  }),
  operation: z.literal("replace_text"),
  before: z.string(),
  after: z.string(),
  reason: z.string().min(1),
  instruction: z.string().optional(),
  status: z.enum(["pending", "accepted", "rejected"]),
  createdBy: z.string().min(1),
  createdAt: isoDateStringSchema
});

export const documentVersionSchema: z.ZodType<DocumentVersion> = z.object({
  id: z.string().min(1),
  createdAt: isoDateStringSchema,
  note: z.string().min(1),
  author: z.enum(["user", "assistant", "system"]),
  patchId: z.string().min(1).optional(),
  snapshotRef: z.string().min(1).optional()
});

export const writerDocumentSchema: z.ZodType<WriterDocument> = z.object({
  schemaVersion: z.literal(1),
  docId: z.string().min(1),
  title: z.string().min(1),
  activePersonaId: z.string().nullable(),
  blocks: z.array(writerBlockSchema),
  annotations: z.array(annotationSchema),
  threads: z.array(threadSchema),
  versions: z.array(documentVersionSchema),
  metadata: z.object({
    createdAt: isoDateStringSchema,
    updatedAt: isoDateStringSchema,
    tags: z.array(z.string()),
    archived: z.boolean().optional()
  })
});

export const styleExampleSchema = z.object({
  id: z.string().min(1),
  before: z.string().min(1),
  after: z.string().min(1),
  note: z.string().optional(),
  createdAt: isoDateStringSchema
});

export const personaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  hardRules: z.array(z.string()),
  likedPhrases: z.array(z.string()),
  dislikedPhrases: z.array(z.string()),
  defaultForDocTypes: z.array(z.string()),
  voice: z.object({
    brevity: z.number().min(0).max(100),
    warmth: z.number().min(0).max(100),
    directness: z.number().min(0).max(100),
    softness: z.number().min(0).max(100)
  }),
  styleExamples: z.array(styleExampleSchema).default([]),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema
});

export const personasFileSchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: isoDateStringSchema,
  personas: z.array(personaSchema)
});

export const preferenceSignalSchema: z.ZodType<PreferenceSignal> = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  direction: z.enum(["prefer", "avoid"]),
  weight: z.number().min(0).max(1),
  evidenceCount: z.number().int().nonnegative()
});

export const preferenceProfileSchema: z.ZodType<PreferenceProfile> = z.object(
  {
    schemaVersion: z.literal(1),
    userId: z.string().min(1),
    updatedAt: isoDateStringSchema,
    signals: z.array(preferenceSignalSchema),
    recentFeedback: z.array(
      z.object({
        id: z.string().min(1),
        patchId: z.string().min(1).optional(),
        instruction: z.string().optional(),
        outcome: z.enum(["accepted", "rejected", "edited"]),
        note: z.string().optional(),
        createdAt: isoDateStringSchema
      })
    )
  }
);

export function parseWriterDocument(input: unknown): WriterDocument {
  return writerDocumentSchema.parse(input);
}

export function parsePersonasFile(input: unknown): PersonasFile {
  return personasFileSchema.parse(input);
}

export function parsePreferenceProfile(input: unknown): PreferenceProfile {
  return preferenceProfileSchema.parse(input);
}

