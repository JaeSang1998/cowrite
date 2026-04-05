export const toolDefinitions = [
  {
    name: "document.list",
    description: "List local writer documents in the current workspace.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "document.read",
    description: "Read the current canonical writer document.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "document.create",
    description: "Create a new local writer document file.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        activePersonaId: { type: ["string", "null"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "document.export",
    description: "Export the current document as Markdown.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "rewrite.selection",
    description: "Create a persona-aware patch proposal for a text range.",
    inputSchema: {
      type: "object",
      properties: {
        blockId: { type: "string" },
        start: { type: "integer" },
        end: { type: "integer" },
        instruction: { type: "string" },
        proposedText: { type: "string" },
      },
      required: ["blockId", "start", "end", "instruction"],
      additionalProperties: false,
    },
  },
  {
    name: "patch.preview",
    description: "Preview the effect of a patch proposal without applying it.",
    inputSchema: {
      type: "object",
      properties: { patch: { type: "object" } },
      required: ["patch"],
      additionalProperties: false,
    },
  },
  {
    name: "patch.apply",
    description: "Apply a patch proposal to the current document file.",
    inputSchema: {
      type: "object",
      properties: { patch: { type: "object" } },
      required: ["patch"],
      additionalProperties: false,
    },
  },
  {
    name: "patch.reject",
    description: "Reject a patch proposal and record feedback.",
    inputSchema: {
      type: "object",
      properties: { patch: { type: "object" }, note: { type: "string" } },
      required: ["patch"],
      additionalProperties: false,
    },
  },
  {
    name: "block.insert",
    description:
      "Insert one or more new blocks before or after a reference block. Supports paragraph, heading, bulletListItem, numberedListItem, quote, checkListItem, codeBlock.",
    inputSchema: {
      type: "object",
      properties: {
        referenceBlockId: { type: "string", description: "The block ID to insert relative to." },
        position: { type: "string", enum: ["before", "after"], description: "Insert before or after the reference block." },
        blocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["paragraph", "heading", "bulletListItem", "numberedListItem", "quote", "checkListItem", "codeBlock"] },
              text: { type: "string" },
              props: {
                type: "object",
                properties: {
                  textAlign: { type: "string", enum: ["left", "center", "right"] },
                  level: { type: "integer", enum: [1, 2, 3], description: "Heading level (only for heading type)." },
                },
              },
            },
            required: ["text"],
            additionalProperties: false,
          },
          description: "Blocks to insert. Type defaults to paragraph.",
        },
        reason: { type: "string" },
      },
      required: ["referenceBlockId", "position", "blocks", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "block.delete",
    description: "Delete one or more blocks by their IDs.",
    inputSchema: {
      type: "object",
      properties: {
        blockIds: { type: "array", items: { type: "string" }, description: "Block IDs to delete." },
        reason: { type: "string" },
      },
      required: ["blockIds", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "block.replace",
    description:
      "Replace all text in a single block by block ID. No character offsets needed — just provide the block ID and the new text.",
    inputSchema: {
      type: "object",
      properties: {
        blockId: { type: "string", description: "The block ID to replace." },
        text: { type: "string", description: "New plain text for the block." },
        reason: { type: "string", description: "Why this replacement is being made." },
      },
      required: ["blockId", "text", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "block.replace_batch",
    description:
      "Replace text in multiple blocks in one atomic call. All replacements are applied together with a single version snapshot.",
    inputSchema: {
      type: "object",
      properties: {
        replacements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              blockId: { type: "string" },
              text: { type: "string" },
            },
            required: ["blockId", "text"],
            additionalProperties: false,
          },
        },
        reason: { type: "string", description: "Why these replacements are being made." },
      },
      required: ["replacements", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "persona.list",
    description: "List personas available to the local user.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "persona.create",
    description: "Create a new persona with the given fields.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        hardRules: { type: "array", items: { type: "string" } },
        likedPhrases: { type: "array", items: { type: "string" } },
        dislikedPhrases: { type: "array", items: { type: "string" } },
        defaultForDocTypes: { type: "array", items: { type: "string" } },
        voice: {
          type: "object",
          properties: {
            brevity: { type: "integer" },
            warmth: { type: "integer" },
            directness: { type: "integer" },
            softness: { type: "integer" },
          },
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
  {
    name: "persona.activate",
    description: "Set the active persona for the current document.",
    inputSchema: {
      type: "object",
      properties: { personaId: { type: "string" } },
      required: ["personaId"],
      additionalProperties: false,
    },
  },
  {
    name: "persona.update",
    description:
      "Update an existing persona's fields (name, description, hardRules, likedPhrases, dislikedPhrases, voice, styleExamples).",
    inputSchema: {
      type: "object",
      properties: {
        personaId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        hardRules: { type: "array", items: { type: "string" } },
        likedPhrases: { type: "array", items: { type: "string" } },
        dislikedPhrases: { type: "array", items: { type: "string" } },
        defaultForDocTypes: { type: "array", items: { type: "string" } },
        voice: {
          type: "object",
          properties: {
            brevity: { type: "integer" },
            warmth: { type: "integer" },
            directness: { type: "integer" },
            softness: { type: "integer" },
          },
        },
        styleExamples: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              before: { type: "string" },
              after: { type: "string" },
              note: { type: "string" },
              createdAt: { type: "string" },
            },
            required: ["id", "before", "after", "createdAt"],
          },
        },
      },
      required: ["personaId"],
      additionalProperties: false,
    },
  },
  {
    name: "persona.delete",
    description: "Delete an existing persona by ID.",
    inputSchema: {
      type: "object",
      properties: { personaId: { type: "string" } },
      required: ["personaId"],
      additionalProperties: false,
    },
  },
  {
    name: "persona.analyze_style",
    description:
      "Analyze a persona's before/after style examples and return a prompt that instructs an LLM to derive hardRules, likedPhrases, dislikedPhrases, and voice settings. After reading the returned prompt, call persona.update to apply the results.",
    inputSchema: {
      type: "object",
      properties: { personaId: { type: "string" } },
      required: ["personaId"],
      additionalProperties: false,
    },
  },
  {
    name: "preference.record_feedback",
    description: "Record accept/reject/edit feedback for the preference profile.",
    inputSchema: {
      type: "object",
      properties: {
        patchId: { type: "string" },
        instruction: { type: "string" },
        outcome: { type: "string", enum: ["accepted", "rejected", "edited"] },
        note: { type: "string" },
      },
      required: ["outcome"],
      additionalProperties: false,
    },
  },
  {
    name: "thread.add_comment",
    description:
      "Add a comment to a specific text range in the document. Creates an annotation and discussion thread. The desktop app will show a real-time cursor animation of the agent selecting the text and leaving the comment.",
    inputSchema: {
      type: "object",
      properties: {
        blockId: { type: "string", description: "The block ID containing the target text." },
        start: { type: "integer", description: "Start character offset within the block." },
        end: { type: "integer", description: "End character offset within the block." },
        body: { type: "string", description: "The comment text to leave." },
        personaId: {
          type: "string",
          description: "The persona ID to attribute the comment to. Defaults to the active persona.",
        },
      },
      required: ["blockId", "start", "end", "body"],
      additionalProperties: false,
    },
  },
];
