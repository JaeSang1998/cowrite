import { create } from "zustand";
import {
  createEmptyPersona,
  starterPersonas,
  type Persona,
} from "@cowrite/writer-core";
import { useDocumentStore } from "./documentStore";

interface PersonaState {
  personas: Persona[];

  setPersonas: (personas: Persona[]) => void;
  activatePersona: (personaId: string) => void;
  createPersona: (overrides?: Partial<Persona>) => Persona;
  reorderPersonas: (fromId: string, toId: string) => void;
  updatePersona: (personaId: string, updates: Partial<Persona>) => void;
  deletePersona: (personaId: string) => void;
}

export function getActivePersona(personas: Persona[], activePersonaId: string | null): Persona {
  return personas.find((p) => p.id === activePersonaId) ?? personas[0];
}

export const usePersonaStore = create<PersonaState>((set) => ({
  personas: starterPersonas.personas,

  setPersonas: (personas) => set({ personas }),

  activatePersona: (personaId) => {
    useDocumentStore.getState().updateActivePersona(personaId);
  },

  createPersona: (overrides) => {
    const persona = createEmptyPersona(overrides);
    set((state) => ({ personas: [...state.personas, persona] }));
    return persona;
  },

  reorderPersonas: (fromId, toId) => {
    set((state) => {
      const items = [...state.personas];
      const fromIdx = items.findIndex((p) => p.id === fromId);
      const toIdx = items.findIndex((p) => p.id === toId);
      if (fromIdx === -1 || toIdx === -1) return state;
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      return { personas: items };
    });
  },

  updatePersona: (personaId, updates) => {
    set((state) => ({
      personas: state.personas.map((p) =>
        p.id === personaId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  deletePersona: (personaId) => {
    set((state) => {
      const filtered = state.personas.filter((p) => p.id !== personaId);
      // If active persona was deleted, switch to the first one
      const { document, updateActivePersona } = useDocumentStore.getState();
      if (document.activePersonaId === personaId && filtered.length > 0) {
        updateActivePersona(filtered[0].id);
      }
      return { personas: filtered };
    });
  },
}));
