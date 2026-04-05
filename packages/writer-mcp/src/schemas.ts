import { z } from "zod";
import { patchProposalSchema } from "@cowrite/writer-core";

export const createDocumentInput = z.object({
  title: z.string().optional(),
  activePersonaId: z.string().nullable().optional(),
});

export const rewriteSelectionInput = z.object({
  blockId: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  instruction: z.string().min(1),
  proposedText: z.string().optional(),
});

export const patchContainerInput = z.object({
  patch: patchProposalSchema,
});

export const rejectPatchInput = patchContainerInput.extend({
  note: z.string().optional(),
});

export const createPersonaInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  hardRules: z.array(z.string()).optional(),
  likedPhrases: z.array(z.string()).optional(),
  dislikedPhrases: z.array(z.string()).optional(),
  defaultForDocTypes: z.array(z.string()).optional(),
  voice: z
    .object({
      brevity: z.number().int().min(0).max(100),
      warmth: z.number().int().min(0).max(100),
      directness: z.number().int().min(0).max(100),
      softness: z.number().int().min(0).max(100),
    })
    .optional(),
});

export const activatePersonaInput = z.object({
  personaId: z.string().min(1),
});

export const updatePersonaInput = z.object({
  personaId: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  hardRules: z.array(z.string()).optional(),
  likedPhrases: z.array(z.string()).optional(),
  dislikedPhrases: z.array(z.string()).optional(),
  defaultForDocTypes: z.array(z.string()).optional(),
  voice: z
    .object({
      brevity: z.number().int().min(0).max(100),
      warmth: z.number().int().min(0).max(100),
      directness: z.number().int().min(0).max(100),
      softness: z.number().int().min(0).max(100),
    })
    .optional(),
  styleExamples: z
    .array(
      z.object({
        id: z.string().min(1),
        before: z.string().min(1),
        after: z.string().min(1),
        note: z.string().optional(),
        createdAt: z.string(),
      })
    )
    .optional(),
});

export const deletePersonaInput = z.object({
  personaId: z.string().min(1),
});

export const analyzeStyleInput = z.object({
  personaId: z.string().min(1),
});

export const blockInsertInput = z.object({
  referenceBlockId: z.string().min(1),
  position: z.enum(["before", "after"]),
  blocks: z.array(z.object({
    type: z.enum(["paragraph", "heading", "bulletListItem", "numberedListItem", "quote", "checkListItem", "codeBlock"]).optional(),
    text: z.string(),
    props: z.object({
      textAlign: z.enum(["left", "center", "right"]).optional(),
      level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    }).optional(),
  })).min(1).max(50),
  reason: z.string().min(1),
});

export const blockDeleteInput = z.object({
  blockIds: z.array(z.string().min(1)).min(1).max(100),
  reason: z.string().min(1),
});

export const blockReplaceInput = z.object({
  blockId: z.string().min(1),
  text: z.string(),
  reason: z.string().min(1),
});

export const blockReplaceBatchInput = z.object({
  replacements: z.array(z.object({
    blockId: z.string().min(1),
    text: z.string(),
  })).min(1).max(100),
  reason: z.string().min(1),
});

export const addCommentInput = z.object({
  blockId: z.string().min(1),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  body: z.string().min(1),
  personaId: z.string().optional(),
});

export const feedbackInput = z.object({
  patchId: z.string().optional(),
  instruction: z.string().optional(),
  outcome: z.enum(["accepted", "rejected", "edited"]),
  note: z.string().optional(),
});
