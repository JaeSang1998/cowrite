import { useEffect } from "react";
import { useSearchStore } from "@/store/searchStore";

export function useEditorKeyboard() {
  const { open: openSearch, isOpen: isSearchOpen } = useSearchStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        openSearch();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d" && !isSearchOpen) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSearch, isSearchOpen]);
}
