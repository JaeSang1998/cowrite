import { create } from "zustand";

export type View = "editor" | "persona";

interface ViewState {
  currentView: View;
  showSidebar: boolean;
  setView: (view: View) => void;
  setShowSidebar: (show: boolean) => void;
  toggleSidebar: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: "editor",
  showSidebar: true,
  setView: (view) => set({ currentView: view }),
  setShowSidebar: (show) => set({ showSidebar: show }),
  toggleSidebar: () => set((s) => ({ showSidebar: !s.showSidebar })),
}));
