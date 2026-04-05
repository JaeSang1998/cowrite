import type { ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useViewStore } from "@/store/viewStore";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { showSidebar, toggleSidebar } = useViewStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {showSidebar && <Sidebar />}
      <main className="relative flex-1 overflow-hidden">
        {!showSidebar && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute left-2 top-2 z-40 flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            title="사이드바 열기"
          >
            <PanelLeft size={16} />
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
