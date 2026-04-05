import { type AddCommentInput, type PatchProposal, type Persona, type PreferenceFeedback, type PreferenceProfile, type PersonasFile, type WriterDocument } from "@cowrite/writer-core";
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
export declare function resolveWriterWorkspacePaths(options?: {
    docPath?: string;
    homeDir?: string;
}): WriterWorkspacePaths;
export declare function ensureWriterWorkspace(paths: WriterWorkspacePaths): Promise<void>;
export declare function readDocumentFromFile(docPath: string): Promise<WriterDocument>;
export declare function writeDocumentToFile(document: WriterDocument, docPath: string): Promise<void>;
export declare function readPersonasFile(personasPath: string): Promise<PersonasFile>;
export declare function writePersonasFile(personas: PersonasFile, personasPath: string): Promise<void>;
export declare function readPreferenceProfileFile(preferencesPath: string): Promise<PreferenceProfile>;
export declare function writePreferenceProfileFile(profile: PreferenceProfile, preferencesPath: string): Promise<void>;
export declare function bootstrapLocalWorkspace(options?: {
    docPath?: string;
    homeDir?: string;
}): Promise<BootstrappedWorkspace>;
export declare function createDocumentFile(options?: {
    title?: string;
    activePersonaId?: string | null;
    docPath?: string;
    homeDir?: string;
}): Promise<BootstrappedWorkspace>;
export declare function listLocalDocuments(directory?: string): Promise<string[]>;
export declare function snapshotDocument(document: WriterDocument, paths: WriterWorkspacePaths, note: string): Promise<string>;
export declare function applyPatchToFile(options: {
    patch: PatchProposal;
    docPath?: string;
    homeDir?: string;
}): Promise<{
    document: WriterDocument;
    snapshotRef: string;
}>;
export declare function addPersonaToFile(options: {
    persona: Partial<Persona>;
    docPath?: string;
    homeDir?: string;
}): Promise<{
    personas: PersonasFile;
    persona: Persona;
}>;
export declare function updatePersonaInFile(options: {
    personaId: string;
    updates: Partial<Persona>;
    docPath?: string;
    homeDir?: string;
}): Promise<{
    personas: PersonasFile;
    persona: Persona;
}>;
export declare function setActivePersona(options: {
    personaId: string;
    docPath?: string;
    homeDir?: string;
}): Promise<WriterDocument>;
export declare function recordFeedbackToFile(options: {
    feedback: Omit<PreferenceFeedback, "id" | "createdAt">;
    docPath?: string;
    homeDir?: string;
}): Promise<PreferenceProfile>;
export declare function addCommentToFile(options: {
    comment: AddCommentInput;
    docPath?: string;
    homeDir?: string;
}): Promise<{
    document: WriterDocument;
    annotationId: string;
    threadId: string;
    commentId: string;
}>;
export declare function exportDocumentFileAsMarkdown(options?: {
    docPath?: string;
    homeDir?: string;
}): Promise<{
    outputPath: string;
    markdown: string;
}>;
//# sourceMappingURL=fs-storage.d.ts.map