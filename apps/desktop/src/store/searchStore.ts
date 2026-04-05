import { create } from "zustand";

interface SearchState {
  isOpen: boolean;
  query: string;
  replaceText: string;
  showReplace: boolean;
  caseSensitive: boolean;
  matchCount: number;
  activeMatchIndex: number;
  selectedCount: number;

  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
  setReplaceText: (t: string) => void;
  toggleReplace: () => void;
  toggleCaseSensitive: () => void;
  setMatchInfo: (count: number, activeIndex: number, selectedCount: number) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: "",
  replaceText: "",
  showReplace: false,
  caseSensitive: false,
  matchCount: 0,
  activeMatchIndex: -1,
  selectedCount: 0,

  open: () => set({ isOpen: true }),
  close: () =>
    set({
      isOpen: false,
      query: "",
      replaceText: "",
      matchCount: 0,
      activeMatchIndex: -1,
      selectedCount: 0,
    }),
  setQuery: (query) => set({ query }),
  setReplaceText: (replaceText) => set({ replaceText }),
  toggleReplace: () => set((s) => ({ showReplace: !s.showReplace })),
  toggleCaseSensitive: () => set((s) => ({ caseSensitive: !s.caseSensitive })),
  setMatchInfo: (matchCount, activeMatchIndex, selectedCount) =>
    set({ matchCount, activeMatchIndex, selectedCount }),
}));
