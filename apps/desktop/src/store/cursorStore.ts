import { create } from "zustand";

/**
 * Animation phases for an agent cursor:
 *  1. entering   – cursor fades in at a random edge position
 *  2. moving     – cursor glides toward the target text block
 *  3. selecting  – highlight sweeps across the target range
 *  4. commenting – comment bubble pops up next to the selection
 *  5. idle       – animation complete, stays visible briefly
 *  6. exiting    – cursor fades out
 */
export type CursorPhase =
  | "entering"
  | "moving"
  | "selecting"
  | "commenting"
  | "idle"
  | "exiting";

export interface AgentCursorState {
  id: string;
  personaName: string;
  personaColor: string;
  phase: CursorPhase;

  /** Cursor position (px, relative to overlay container) */
  x: number;
  y: number;

  /** Comment content */
  commentBody: string;

  /** Underlying data ids */
  threadId: string;
  annotationId: string;
  blockId: string;
  start: number;
  end: number;
  quote: string;
}

interface CursorStore {
  cursors: AgentCursorState[];
  /** Push a new agent cursor animation */
  addCursor: (cursor: AgentCursorState) => void;
  /** Update a cursor's phase / position */
  updateCursor: (id: string, updates: Partial<AgentCursorState>) => void;
  /** Remove a cursor after animation completes */
  removeCursor: (id: string) => void;
}

export const useCursorStore = create<CursorStore>((set) => ({
  cursors: [],

  addCursor: (cursor) =>
    set((state) => ({
      cursors: [...state.cursors, cursor]
    })),

  updateCursor: (id, updates) =>
    set((state) => ({
      cursors: state.cursors.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    })),

  removeCursor: (id) =>
    set((state) => ({
      cursors: state.cursors.filter((c) => c.id !== id)
    }))
}));

/** Persona → color mapping for visual distinction */
const AGENT_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316"  // orange
];

const personaColorMap = new Map<string, string>();

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getPersonaColor(personaId: string): string {
  if (!personaColorMap.has(personaId)) {
    const index = hashString(personaId) % AGENT_COLORS.length;
    personaColorMap.set(personaId, AGENT_COLORS[index]);
  }
  return personaColorMap.get(personaId)!;
}
