import { type Persona, type PreferenceProfile } from "@cowrite/writer-core";
export interface RewriteRequest {
    selectionText: string;
    instruction: string;
    persona: Persona;
    preferenceProfile?: PreferenceProfile;
}
export interface RewriteCandidate {
    id: string;
    label: string;
    text: string;
    reason: string;
}
export declare function createRewriteCandidates(request: RewriteRequest): RewriteCandidate[];
export declare function rewriteSelectionLocally(request: RewriteRequest): {
    text: string;
    reason: string;
    candidates: RewriteCandidate[];
};
export declare function buildAnalyzeStylePrompt(persona: Persona): string;
export declare function buildRewriteSelectionPrompt(request: RewriteRequest): string;
//# sourceMappingURL=prompts.d.ts.map