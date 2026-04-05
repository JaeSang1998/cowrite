import { loadWorkspace, getActivePersonaContext } from "./helpers.js";

export async function listResources() {
  const { document } = await loadWorkspace();

  return {
    resources: [
      {
        uri: "writer://users/local-user/personas",
        name: "Personas",
        description: "Known personas for the local Cowrite profile.",
        mimeType: "application/json",
      },
      {
        uri: "writer://users/local-user/active-persona",
        name: "Active Persona",
        description: "The persona currently attached to the open document.",
        mimeType: "application/json",
      },
      {
        uri: "writer://users/local-user/preference-profile",
        name: "Preference Profile",
        description: "Behavior-derived preference signals and feedback history.",
        mimeType: "application/json",
      },
      {
        uri: `writer://docs/${document.docId}`,
        name: document.title,
        description: "Canonical writer document.",
        mimeType: "application/json",
      },
      {
        uri: `writer://docs/${document.docId}/threads`,
        name: "Document Threads",
        description: "Annotation-linked discussion threads.",
        mimeType: "application/json",
      },
      {
        uri: `writer://docs/${document.docId}/versions`,
        name: "Document Versions",
        description: "Snapshot and version history for the current document.",
        mimeType: "application/json",
      },
    ],
  };
}

export async function readResource(uri: string) {
  const { workspace, persona } = await getActivePersonaContext();

  const resourceMap: Record<string, unknown> = {
    "writer://users/local-user/personas": workspace.personas,
    "writer://users/local-user/active-persona": persona,
    "writer://users/local-user/preference-profile": workspace.preferences,
    [`writer://docs/${workspace.document.docId}`]: workspace.document,
    [`writer://docs/${workspace.document.docId}/threads`]: workspace.document.threads,
    [`writer://docs/${workspace.document.docId}/versions`]: workspace.document.versions,
  };

  const data = resourceMap[uri];
  if (data === undefined) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  return {
    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }],
  };
}
