import { AppShell } from "@/components/layout/AppShell";
import { EditorView } from "@/components/editor/EditorView";
import { PersonaSettingsView } from "@/components/persona/PersonaSettingsView";
import { useViewStore } from "@/store/viewStore";
import { useDocumentWatcher } from "@/lib/useDocumentWatcher";
import { useAgentCommentWatcher } from "@/lib/useAgentCommentWatcher";
import { useRestoreLastDocument } from "@/lib/useRestoreLastDocument";
import { useAutoSave } from "@/lib/useAutoSave";
import { usePersonasWatcher } from "@/lib/usePersonasWatcher";

export default function App() {
  const { currentView } = useViewStore();
  useRestoreLastDocument();
  useDocumentWatcher();
  useAgentCommentWatcher();
  useAutoSave();
  usePersonasWatcher();

  return (
    <AppShell>
      {currentView === "editor" && <EditorView />}
      {currentView === "persona" && <PersonaSettingsView />}
    </AppShell>
  );
}
