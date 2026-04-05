import { buildAnalyzeStylePrompt } from "@cowrite/writer-ai";
import { addPersonaToFile, deletePersonaFromFile, setActivePersona, updatePersonaInFile } from "@cowrite/writer-storage";
import { getActiveDocPath, loadWorkspace, jsonContent, type ToolResult } from "../helpers.js";
import { createPersonaInput, deletePersonaInput, activatePersonaInput, updatePersonaInput, analyzeStyleInput } from "../schemas.js";

function summarizePersona(p: { id: string; name: string; description: string; defaultForDocTypes: string[]; voice: { brevity: number; warmth: number; directness: number; softness: number }; styleExamples: unknown[] }) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    defaultForDocTypes: p.defaultForDocTypes,
    voice: p.voice,
    styleExampleCount: p.styleExamples.length,
  };
}

export async function handlePersonaList(): Promise<ToolResult> {
  const workspace = await loadWorkspace();
  return jsonContent({
    updatedAt: workspace.personas.updatedAt,
    personas: workspace.personas.personas.map(summarizePersona),
  });
}

export async function handlePersonaCreate(args: unknown): Promise<ToolResult> {
  const input = createPersonaInput.parse(args ?? {});
  const result = await addPersonaToFile({ persona: input });
  return jsonContent({ persona: summarizePersona(result.persona) });
}

export async function handlePersonaActivate(args: unknown): Promise<ToolResult> {
  const input = activatePersonaInput.parse(args ?? {});
  const document = await setActivePersona({
    docPath: getActiveDocPath(),
    personaId: input.personaId,
  });
  return jsonContent({
    activePersonaId: document.activePersonaId,
    docId: document.docId,
  });
}

export async function handlePersonaUpdate(args: unknown): Promise<ToolResult> {
  const input = updatePersonaInput.parse(args ?? {});
  const { personaId, ...updates } = input;
  const result = await updatePersonaInFile({
    personaId,
    updates,
    docPath: getActiveDocPath(),
  });
  return jsonContent({ persona: result.persona });
}

export async function handlePersonaDelete(args: unknown): Promise<ToolResult> {
  const input = deletePersonaInput.parse(args ?? {});
  await deletePersonaFromFile({
    personaId: input.personaId,
    docPath: getActiveDocPath(),
  });
  return jsonContent({ deletedPersonaId: input.personaId });
}

export async function handlePersonaAnalyzeStyle(args: unknown): Promise<ToolResult> {
  const input = analyzeStyleInput.parse(args ?? {});
  const workspace = await loadWorkspace();
  const persona = workspace.personas.personas.find((p) => p.id === input.personaId);
  if (!persona) {
    throw new Error(`Persona "${input.personaId}" not found.`);
  }
  const prompt = buildAnalyzeStylePrompt(persona);
  return jsonContent({
    personaId: persona.id,
    personaName: persona.name,
    exampleCount: persona.styleExamples.length,
    prompt,
  });
}
