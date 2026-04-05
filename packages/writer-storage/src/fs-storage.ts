import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  addCommentToDocument,
  appendFeedback,
  applyPatch,
  replaceBlocks,
  insertBlocks,
  deleteBlocks,
  type BlockReplacement,
  type BlockInsert,
  createBlock,
  createDraftDocument,
  createStarterPersonasFile,
  createStarterPreferenceProfile,
  createEmptyPersona,
  exportDocumentAsMarkdown,
  parsePreferenceProfile,
  parsePersonasFile,
  parseWriterDocument,
  type AddCommentInput,
  type PatchProposal,
  type Persona,
  type PreferenceFeedback,
  type PreferenceProfile,
  type PersonasFile,
  type WriterDocument
} from "@cowrite/writer-core";

export interface WriterWorkspacePaths {
  docPath: string;
  homeDir: string;
  personasPath: string;
  preferencesPath: string;
  versionsDir: string;
  exportsDir: string;
}

export interface BootstrappedWorkspace {
  paths: WriterWorkspacePaths;
  document: WriterDocument;
  personas: PersonasFile;
  preferences: PreferenceProfile;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(directoryPath: string): Promise<void> {
  await mkdir(directoryPath, { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await ensureDirectory(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function resolveWriterWorkspacePaths(options?: {
  docPath?: string;
  homeDir?: string;
}): WriterWorkspacePaths {
  const docPath = path.resolve(
    options?.docPath ?? path.join(process.cwd(), "draft.writer.json")
  );
  const homeDir = path.resolve(options?.homeDir ?? path.join(os.homedir(), ".writer"));

  return {
    docPath,
    homeDir,
    personasPath: path.join(homeDir, "personas.json"),
    preferencesPath: path.join(homeDir, "preferences.json"),
    versionsDir: path.join(homeDir, "versions"),
    exportsDir: path.join(homeDir, "exports")
  };
}

export async function ensureWriterWorkspace(
  paths: WriterWorkspacePaths
): Promise<void> {
  await Promise.all([
    ensureDirectory(path.dirname(paths.docPath)),
    ensureDirectory(paths.homeDir),
    ensureDirectory(paths.versionsDir),
    ensureDirectory(paths.exportsDir)
  ]);
}

export async function readDocumentFromFile(docPath: string): Promise<WriterDocument> {
  return parseWriterDocument(await readJsonFile<unknown>(docPath));
}

export async function writeDocumentToFile(
  document: WriterDocument,
  docPath: string
): Promise<void> {
  await writeJsonFile(docPath, parseWriterDocument(document));
}

export async function readPersonasFile(
  personasPath: string
): Promise<PersonasFile> {
  return parsePersonasFile(await readJsonFile<unknown>(personasPath));
}

export async function writePersonasFile(
  personas: PersonasFile,
  personasPath: string
): Promise<void> {
  await writeJsonFile(personasPath, parsePersonasFile(personas));
}

export async function readPreferenceProfileFile(
  preferencesPath: string
): Promise<PreferenceProfile> {
  return parsePreferenceProfile(await readJsonFile<unknown>(preferencesPath));
}

export async function writePreferenceProfileFile(
  profile: PreferenceProfile,
  preferencesPath: string
): Promise<void> {
  await writeJsonFile(preferencesPath, parsePreferenceProfile(profile));
}

export async function bootstrapLocalWorkspace(options?: {
  docPath?: string;
  homeDir?: string;
}): Promise<BootstrappedWorkspace> {
  const paths = resolveWriterWorkspacePaths(options);
  await ensureWriterWorkspace(paths);

  const document = (await fileExists(paths.docPath))
    ? await readDocumentFromFile(paths.docPath)
    : createDraftDocument();
  const personas = (await fileExists(paths.personasPath))
    ? await readPersonasFile(paths.personasPath)
    : createStarterPersonasFile();
  const preferences = (await fileExists(paths.preferencesPath))
    ? await readPreferenceProfileFile(paths.preferencesPath)
    : createStarterPreferenceProfile();

  if (!(await fileExists(paths.docPath))) {
    await writeDocumentToFile(document, paths.docPath);
  }

  if (!(await fileExists(paths.personasPath))) {
    await writePersonasFile(personas, paths.personasPath);
  }

  if (!(await fileExists(paths.preferencesPath))) {
    await writePreferenceProfileFile(preferences, paths.preferencesPath);
  }

  return {
    paths,
    document,
    personas,
    preferences
  };
}

export async function createDocumentFile(options?: {
  title?: string;
  activePersonaId?: string | null;
  docPath?: string;
  homeDir?: string;
}): Promise<BootstrappedWorkspace> {
  const paths = resolveWriterWorkspacePaths(options);
  await ensureWriterWorkspace(paths);

  const document = {
    ...createDraftDocument({
      title: options?.title ?? "Untitled",
      activePersonaId: options?.activePersonaId ?? "persona_default"
    }),
    blocks: [createBlock({ id: "blk_new", text: "" })]
  };

  await writeDocumentToFile(document, paths.docPath);

  const personas = (await fileExists(paths.personasPath))
    ? await readPersonasFile(paths.personasPath)
    : createStarterPersonasFile();
  const preferences = (await fileExists(paths.preferencesPath))
    ? await readPreferenceProfileFile(paths.preferencesPath)
    : createStarterPreferenceProfile();

  if (!(await fileExists(paths.personasPath))) {
    await writePersonasFile(personas, paths.personasPath);
  }

  if (!(await fileExists(paths.preferencesPath))) {
    await writePreferenceProfileFile(preferences, paths.preferencesPath);
  }

  return {
    paths,
    document,
    personas,
    preferences
  };
}

export async function listLocalDocuments(
  directory = process.cwd()
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".writer.json"))
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

export async function snapshotDocument(
  document: WriterDocument,
  paths: WriterWorkspacePaths,
  note: string
): Promise<string> {
  const snapshotName = `${document.docId}-${Date.now()}-${note
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.json`;
  const snapshotPath = path.join(paths.versionsDir, snapshotName);

  await writeJsonFile(snapshotPath, document);

  return snapshotPath;
}

export async function applyPatchToFile(options: {
  patch: PatchProposal;
  docPath?: string;
  homeDir?: string;
}): Promise<{
  document: WriterDocument;
  snapshotRef: string;
}> {
  const workspace = await bootstrapLocalWorkspace(options);
  const snapshotRef = await snapshotDocument(
    workspace.document,
    workspace.paths,
    `before-${options.patch.patchId}`
  );
  const nextDocument = applyPatch(workspace.document, options.patch);
  const latestVersion = nextDocument.versions[nextDocument.versions.length - 1];

  latestVersion.snapshotRef = snapshotRef;
  await writeDocumentToFile(nextDocument, workspace.paths.docPath);

  return {
    document: nextDocument,
    snapshotRef
  };
}

export async function replaceBlocksInFile(options: {
  replacements: BlockReplacement[];
  reason: string;
  docPath?: string;
  homeDir?: string;
}): Promise<{ document: WriterDocument; snapshotRef: string }> {
  const workspace = await bootstrapLocalWorkspace(options);
  const snapshotRef = await snapshotDocument(
    workspace.document,
    workspace.paths,
    "before-block-replace"
  );
  const nextDocument = replaceBlocks(workspace.document, options.replacements, options.reason);
  await writeDocumentToFile(nextDocument, workspace.paths.docPath);
  return { document: nextDocument, snapshotRef };
}

export async function insertBlocksInFile(options: {
  insert: BlockInsert;
  reason: string;
  docPath?: string;
  homeDir?: string;
}): Promise<{ document: WriterDocument; insertedBlockIds: string[]; snapshotRef: string }> {
  const workspace = await bootstrapLocalWorkspace(options);
  const snapshotRef = await snapshotDocument(
    workspace.document, workspace.paths, "before-block-insert"
  );
  const nextDocument = insertBlocks(workspace.document, options.insert, options.reason);

  // Compute inserted block IDs by diffing
  const oldIds = new Set(workspace.document.blocks.map((b) => b.id));
  const insertedBlockIds = nextDocument.blocks
    .filter((b) => !oldIds.has(b.id))
    .map((b) => b.id);

  await writeDocumentToFile(nextDocument, workspace.paths.docPath);
  return { document: nextDocument, insertedBlockIds, snapshotRef };
}

export async function deleteBlocksInFile(options: {
  blockIds: string[];
  reason: string;
  docPath?: string;
  homeDir?: string;
}): Promise<{ document: WriterDocument; snapshotRef: string }> {
  const workspace = await bootstrapLocalWorkspace(options);
  const snapshotRef = await snapshotDocument(
    workspace.document, workspace.paths, "before-block-delete"
  );
  const nextDocument = deleteBlocks(workspace.document, options.blockIds, options.reason);
  await writeDocumentToFile(nextDocument, workspace.paths.docPath);
  return { document: nextDocument, snapshotRef };
}

export async function addPersonaToFile(options: {
  persona: Partial<Persona>;
  docPath?: string;
  homeDir?: string;
}): Promise<{ personas: PersonasFile; persona: Persona }> {
  const workspace = await bootstrapLocalWorkspace(options);
  const persona = createEmptyPersona(options.persona);
  const personas: PersonasFile = {
    ...workspace.personas,
    updatedAt: new Date().toISOString(),
    personas: [...workspace.personas.personas, persona]
  };

  await writePersonasFile(personas, workspace.paths.personasPath);
  return { personas, persona };
}

export async function updatePersonaInFile(options: {
  personaId: string;
  updates: Partial<Persona>;
  docPath?: string;
  homeDir?: string;
}): Promise<{ personas: PersonasFile; persona: Persona }> {
  const workspace = await bootstrapLocalWorkspace(options);
  const idx = workspace.personas.personas.findIndex(
    (p) => p.id === options.personaId
  );

  if (idx === -1) {
    throw new Error(`Persona "${options.personaId}" not found.`);
  }

  const persona: Persona = {
    ...workspace.personas.personas[idx],
    ...options.updates,
    id: options.personaId,
    updatedAt: new Date().toISOString()
  };

  const personas: PersonasFile = {
    ...workspace.personas,
    updatedAt: new Date().toISOString(),
    personas: workspace.personas.personas.map((p, i) =>
      i === idx ? persona : p
    )
  };

  await writePersonasFile(personas, workspace.paths.personasPath);
  return { personas, persona };
}

export async function deletePersonaFromFile(options: {
  personaId: string;
  docPath?: string;
  homeDir?: string;
}): Promise<{ personas: PersonasFile }> {
  const workspace = await bootstrapLocalWorkspace(options);
  const idx = workspace.personas.personas.findIndex(
    (p) => p.id === options.personaId
  );

  if (idx === -1) {
    throw new Error(`Persona "${options.personaId}" not found.`);
  }

  const personas: PersonasFile = {
    ...workspace.personas,
    updatedAt: new Date().toISOString(),
    personas: workspace.personas.personas.filter((p) => p.id !== options.personaId),
  };

  await writePersonasFile(personas, workspace.paths.personasPath);

  // If the deleted persona was active, clear or reset activePersonaId
  if (workspace.document.activePersonaId === options.personaId) {
    const newActiveId = personas.personas[0]?.id ?? null;
    const document: WriterDocument = {
      ...workspace.document,
      activePersonaId: newActiveId,
      metadata: {
        ...workspace.document.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    await writeDocumentToFile(document, workspace.paths.docPath);
  }

  return { personas };
}

export async function setActivePersona(options: {
  personaId: string;
  docPath?: string;
  homeDir?: string;
}): Promise<WriterDocument> {
  const workspace = await bootstrapLocalWorkspace(options);
  const document: WriterDocument = {
    ...workspace.document,
    activePersonaId: options.personaId,
    metadata: {
      ...workspace.document.metadata,
      updatedAt: new Date().toISOString()
    }
  };

  await writeDocumentToFile(document, workspace.paths.docPath);
  return document;
}

export async function recordFeedbackToFile(options: {
  feedback: Omit<PreferenceFeedback, "id" | "createdAt">;
  docPath?: string;
  homeDir?: string;
}): Promise<PreferenceProfile> {
  const workspace = await bootstrapLocalWorkspace(options);
  const profile = appendFeedback(workspace.preferences, options.feedback);

  await writePreferenceProfileFile(profile, workspace.paths.preferencesPath);
  return profile;
}

export async function addCommentToFile(options: {
  comment: AddCommentInput;
  docPath?: string;
  homeDir?: string;
}): Promise<{
  document: WriterDocument;
  annotationId: string;
  threadId: string;
  commentId: string;
}> {
  const workspace = await bootstrapLocalWorkspace(options);
  const result = addCommentToDocument(workspace.document, options.comment);

  await writeDocumentToFile(result.document, workspace.paths.docPath);

  return result;
}

export async function exportDocumentFileAsMarkdown(options?: {
  docPath?: string;
  homeDir?: string;
}): Promise<{
  outputPath: string;
  markdown: string;
}> {
  const workspace = await bootstrapLocalWorkspace(options);
  const markdown = exportDocumentAsMarkdown(workspace.document);
  const outputPath = path.join(
    workspace.paths.exportsDir,
    `${workspace.document.docId}.md`
  );

  await writeFile(outputPath, `${markdown}\n`, "utf8");

  return {
    outputPath,
    markdown
  };
}

