import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { addCommentToDocument, appendFeedback, applyPatch, createBlock, createDraftDocument, createStarterPersonasFile, createStarterPreferenceProfile, createEmptyPersona, exportDocumentAsMarkdown, parsePreferenceProfile, parsePersonasFile, parseWriterDocument } from "@vvrite/writer-core";
async function fileExists(filePath) {
    try {
        await stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function ensureDirectory(directoryPath) {
    await mkdir(directoryPath, { recursive: true });
}
async function readJsonFile(filePath) {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
}
async function writeJsonFile(filePath, value) {
    await ensureDirectory(path.dirname(filePath));
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
export function resolveWriterWorkspacePaths(options) {
    const docPath = path.resolve(options?.docPath ?? path.join(process.cwd(), "draft.writer.json"));
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
export async function ensureWriterWorkspace(paths) {
    await Promise.all([
        ensureDirectory(path.dirname(paths.docPath)),
        ensureDirectory(paths.homeDir),
        ensureDirectory(paths.versionsDir),
        ensureDirectory(paths.exportsDir)
    ]);
}
export async function readDocumentFromFile(docPath) {
    return parseWriterDocument(await readJsonFile(docPath));
}
export async function writeDocumentToFile(document, docPath) {
    await writeJsonFile(docPath, parseWriterDocument(document));
}
export async function readPersonasFile(personasPath) {
    return parsePersonasFile(await readJsonFile(personasPath));
}
export async function writePersonasFile(personas, personasPath) {
    await writeJsonFile(personasPath, parsePersonasFile(personas));
}
export async function readPreferenceProfileFile(preferencesPath) {
    return parsePreferenceProfile(await readJsonFile(preferencesPath));
}
export async function writePreferenceProfileFile(profile, preferencesPath) {
    await writeJsonFile(preferencesPath, parsePreferenceProfile(profile));
}
export async function bootstrapLocalWorkspace(options) {
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
export async function createDocumentFile(options) {
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
export async function listLocalDocuments(directory = process.cwd()) {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".writer.json"))
        .map((entry) => path.join(directory, entry.name))
        .sort();
}
export async function snapshotDocument(document, paths, note) {
    const snapshotName = `${document.docId}-${Date.now()}-${note
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}.json`;
    const snapshotPath = path.join(paths.versionsDir, snapshotName);
    await writeJsonFile(snapshotPath, document);
    return snapshotPath;
}
export async function applyPatchToFile(options) {
    const workspace = await bootstrapLocalWorkspace(options);
    const snapshotRef = await snapshotDocument(workspace.document, workspace.paths, `before-${options.patch.patchId}`);
    const nextDocument = applyPatch(workspace.document, options.patch);
    const latestVersion = nextDocument.versions[nextDocument.versions.length - 1];
    latestVersion.snapshotRef = snapshotRef;
    await writeDocumentToFile(nextDocument, workspace.paths.docPath);
    return {
        document: nextDocument,
        snapshotRef
    };
}
export async function addPersonaToFile(options) {
    const workspace = await bootstrapLocalWorkspace(options);
    const persona = createEmptyPersona(options.persona);
    const personas = {
        ...workspace.personas,
        updatedAt: new Date().toISOString(),
        personas: [...workspace.personas.personas, persona]
    };
    await writePersonasFile(personas, workspace.paths.personasPath);
    return { personas, persona };
}
export async function updatePersonaInFile(options) {
    const workspace = await bootstrapLocalWorkspace(options);
    const idx = workspace.personas.personas.findIndex((p) => p.id === options.personaId);
    if (idx === -1) {
        throw new Error(`Persona "${options.personaId}" not found.`);
    }
    const persona = {
        ...workspace.personas.personas[idx],
        ...options.updates,
        id: options.personaId,
        updatedAt: new Date().toISOString()
    };
    const personas = {
        ...workspace.personas,
        updatedAt: new Date().toISOString(),
        personas: workspace.personas.personas.map((p, i) => i === idx ? persona : p)
    };
    await writePersonasFile(personas, workspace.paths.personasPath);
    return { personas, persona };
}
export async function setActivePersona(options) {
    const workspace = await bootstrapLocalWorkspace(options);
    const document = {
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
export async function recordFeedbackToFile(options) {
    const workspace = await bootstrapLocalWorkspace(options);
    const profile = appendFeedback(workspace.preferences, options.feedback);
    await writePreferenceProfileFile(profile, workspace.paths.preferencesPath);
    return profile;
}
export async function addCommentToFile(options) {
    const workspace = await bootstrapLocalWorkspace(options);
    const result = addCommentToDocument(workspace.document, options.comment);
    await writeDocumentToFile(result.document, workspace.paths.docPath);
    return result;
}
export async function exportDocumentFileAsMarkdown(options) {
    const workspace = await bootstrapLocalWorkspace(options);
    const markdown = exportDocumentAsMarkdown(workspace.document);
    const outputPath = path.join(workspace.paths.exportsDir, `${workspace.document.docId}.md`);
    await writeFile(outputPath, `${markdown}\n`, "utf8");
    return {
        outputPath,
        markdown
    };
}
//# sourceMappingURL=fs-storage.js.map