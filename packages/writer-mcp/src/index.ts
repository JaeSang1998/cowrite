import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { listResources, readResource } from "./resources.js";
import { listPrompts, getPrompt } from "./prompts.js";
import { toolDefinitions } from "./tool-definitions.js";
import { handleDocumentList, handleDocumentRead, handleDocumentCreate, handleDocumentExport } from "./tools/document.js";
import { handleRewriteSelection } from "./tools/rewrite.js";
import { handlePatchPreview, handlePatchApply, handlePatchReject } from "./tools/patch.js";
import { handleBlockInsert, handleBlockDelete, handleBlockReplace, handleBlockReplaceBatch } from "./tools/block.js";
import { handlePersonaList, handlePersonaCreate, handlePersonaActivate, handlePersonaUpdate, handlePersonaDelete, handlePersonaAnalyzeStyle } from "./tools/persona.js";
import { handleRecordFeedback } from "./tools/preference.js";
import { handleAddComment } from "./tools/thread.js";
import type { ToolResult } from "./helpers.js";

const server = new Server(
  { name: "writer-mcp", version: "0.1.0" },
  { capabilities: { resources: {}, tools: {}, prompts: {} } }
);

// --- Resources ---
server.setRequestHandler(ListResourcesRequestSchema, listResources);
server.setRequestHandler(ReadResourceRequestSchema, (req) => readResource(req.params.uri));

// --- Prompts ---
server.setRequestHandler(ListPromptsRequestSchema, listPrompts);
server.setRequestHandler(GetPromptRequestSchema, (req) =>
  getPrompt(req.params.name, req.params.arguments)
);

// --- Tools ---
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolDefinitions }));

const toolHandlers: Record<string, (args: unknown) => Promise<ToolResult>> = {
  "document.list": handleDocumentList,
  "document.read": handleDocumentRead,
  "document.create": handleDocumentCreate,
  "document.export": handleDocumentExport,
  "rewrite.selection": handleRewriteSelection,
  "patch.preview": handlePatchPreview,
  "patch.apply": handlePatchApply,
  "patch.reject": handlePatchReject,
  "block.insert": handleBlockInsert,
  "block.delete": handleBlockDelete,
  "block.replace": handleBlockReplace,
  "block.replace_batch": handleBlockReplaceBatch,
  "persona.list": handlePersonaList,
  "persona.create": handlePersonaCreate,
  "persona.activate": handlePersonaActivate,
  "persona.update": handlePersonaUpdate,
  "persona.delete": handlePersonaDelete,
  "persona.analyze_style": handlePersonaAnalyzeStyle,
  "preference.record_feedback": handleRecordFeedback,
  "thread.add_comment": handleAddComment,
};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const handler = toolHandlers[request.params.name];
    if (!handler) throw new Error(`Unknown tool: ${request.params.name}`);
    return await handler(request.params.arguments);
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: error instanceof Error ? error.message : "Unknown MCP tool error",
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
