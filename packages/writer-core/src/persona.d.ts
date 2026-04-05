import type { Persona, PersonasFile, PreferenceFeedback, PreferenceProfile } from "./types.js";
export declare function createDefaultPersona(): Persona;
export declare function createReflectivePersona(): Persona;
export declare function createEmptyPersona(overrides?: Partial<Persona>): Persona;
export declare function createPlayfulFriendPersona(): Persona;
export declare function createStarterPersonasFile(): PersonasFile;
export declare function createStarterPreferenceProfile(): PreferenceProfile;
export declare function summarizePersonaConstraints(persona: Persona, profile?: PreferenceProfile): string;
export declare function appendFeedback(profile: PreferenceProfile, feedback: Omit<PreferenceFeedback, "id" | "createdAt">): PreferenceProfile;
//# sourceMappingURL=persona.d.ts.map