import { summarizePersonaConstraints } from "@cowrite/writer-core";
import { buildRewriteSelectionPrompt } from "@cowrite/writer-ai";
import { getActivePersonaContext } from "./helpers.js";

export async function listPrompts() {
  return {
    prompts: [
      {
        name: "rewrite_as_active_persona",
        description: "Rewrite the selected text according to the active persona.",
        arguments: [
          { name: "selection", description: "The selected text segment.", required: true },
          { name: "instruction", description: "The user instruction for the rewrite.", required: true },
        ],
      },
      {
        name: "make_less_ai_like_without_losing_meaning",
        description: "Reduce AI-like polish while preserving meaning.",
        arguments: [
          { name: "selection", description: "The selected text segment.", required: true },
        ],
      },
      {
        name: "summarize_persona_constraints",
        description: "Summarize the active persona constraints and feedback signals.",
        arguments: [],
      },
    ],
  };
}

export async function getPrompt(name: string, args?: Record<string, string>) {
  const { persona, workspace } = await getActivePersonaContext();
  const selection = args?.selection ?? "";
  const instruction = args?.instruction ?? "이 부분만 더 담백하게";

  if (name === "summarize_persona_constraints") {
    return {
      description: "Current persona and preference constraints",
      messages: [
        {
          role: "user",
          content: { type: "text", text: summarizePersonaConstraints(persona, workspace.preferences) },
        },
      ],
    };
  }

  if (name === "rewrite_as_active_persona" || name === "make_less_ai_like_without_losing_meaning") {
    return {
      description: "Persona-aware rewrite prompt",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildRewriteSelectionPrompt({
              selectionText: selection,
              instruction:
                name === "make_less_ai_like_without_losing_meaning"
                  ? "AI 같은 느낌을 줄이되 의미는 유지"
                  : instruction,
              persona,
              preferenceProfile: workspace.preferences,
            }),
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
}
