import { useEffect, useRef } from "react";
import { usePersonaStore } from "@/store/personaStore";
import type { Persona } from "@cowrite/writer-core";

type FsModule = typeof import("@tauri-apps/plugin-fs");

const PERSONAS_PATH =
  "/Users/ijaesang/.writer/personas.json";

interface PersonasFile {
  schemaVersion: 1;
  updatedAt: string;
  personas: Persona[];
}

/** Serialize the personas array into the full file format */
function buildPersonasFile(personas: Persona[]): PersonasFile {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    personas,
  };
}

/**
 * Watches the personas file (~/.writer/personas.json) for external changes
 * (e.g. MCP creating or updating personas) and syncs them into the store.
 * Also persists store changes back to the file so MCP can read them.
 */
export function usePersonasWatcher() {
  const setPersonas = usePersonaStore((s) => s.setPersonas);
  const lastJsonRef = useRef<string>("");
  /** Suppresses file-watch reload right after we write */
  const skipNextReloadRef = useRef(false);

  // --- Persist store → file ---
  useEffect(() => {
    const unsubscribe = usePersonaStore.subscribe(async (state, prevState) => {
      if (state.personas === prevState.personas) return;

      const json = JSON.stringify(state.personas);
      if (json === lastJsonRef.current) return;

      lastJsonRef.current = json;
      skipNextReloadRef.current = true;

      try {
        const fs: FsModule = await import("@tauri-apps/plugin-fs");
        const content = JSON.stringify(buildPersonasFile(state.personas), null, 2) + "\n";
        await fs.writeTextFile(PERSONAS_PATH, content);
      } catch {
        // Not in Tauri environment or write failed
      }
    });
    return unsubscribe;
  }, []);

  // --- Watch file → store ---
  useEffect(() => {
    lastJsonRef.current = JSON.stringify(usePersonaStore.getState().personas);

    let cleanup: (() => void) | null = null;

    const reload = async () => {
      if (skipNextReloadRef.current) {
        skipNextReloadRef.current = false;
        return;
      }

      try {
        const fs: FsModule = await import("@tauri-apps/plugin-fs");
        const content = await fs.readTextFile(PERSONAS_PATH);

        const parsed: PersonasFile = JSON.parse(content);
        const json = JSON.stringify(parsed.personas);
        if (json !== lastJsonRef.current) {
          lastJsonRef.current = json;
          setPersonas(parsed.personas);
        }
      } catch {
        // File might not exist yet
      }
    };

    // Initial load
    reload();

    (async () => {
      try {
        const fs: FsModule = await import("@tauri-apps/plugin-fs");
        if (fs.watchImmediate) {
          const unwatch = await fs.watchImmediate(
            PERSONAS_PATH,
            () => reload(),
            { recursive: false }
          );
          cleanup = () => unwatch();
          return;
        }
      } catch {
        // Not in Tauri environment
      }

      // Fallback: poll
      const interval = setInterval(reload, 2000);
      cleanup = () => clearInterval(interval);
    })();

    return () => {
      cleanup?.();
    };
  }, [setPersonas]);
}
