import { useEffect, useRef, useCallback } from "react";
import { useBlockNoteEditor } from "@blocknote/react";
import {
  ChevronUp,
  ChevronDown,
  X,
  Replace,
  ReplaceAll,
  CaseSensitive,
} from "lucide-react";
import { useSearchStore } from "@/store/searchStore";
import { getTiptapEditor, getTiptapView } from "@/lib/editorBridge";
import {
  createSearchPlugin,
  setSearchQuery,
  navigateMatch,
  selectNextMatch,
  selectAllMatches,
  replaceCurrentMatch,
  replaceSelectedMatches,
  replaceAllMatches,
  clearSearch,
  getSelectionText,
} from "@/lib/searchPlugin";

export function FindReplaceBar() {
  const editor = useBlockNoteEditor();
  const {
    isOpen,
    query,
    replaceText,
    showReplace,
    caseSensitive,
    matchCount,
    activeMatchIndex,
    selectedCount,
    close,
    setQuery,
    setReplaceText,
    toggleReplace,
    toggleCaseSensitive,
    setMatchInfo,
  } = useSearchStore();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const pluginRegistered = useRef(false);

  const getView = useCallback(() => {
    return getTiptapView(editor);
  }, [editor]);

  const ensurePlugin = useCallback(() => {
    const tiptap = getTiptapEditor(editor);
    if (!tiptap) return;
    if (!pluginRegistered.current) {
      tiptap.registerPlugin(createSearchPlugin());
      pluginRegistered.current = true;
    }
  }, [editor]);

  useEffect(() => {
    if (!isOpen) {
      if (pluginRegistered.current) {
        const view = getView();
        if (view) clearSearch(view);
        try {
          getTiptapEditor(editor)?.unregisterPlugin("search");
        } catch {
          // plugin may already be removed
        }
        pluginRegistered.current = false;
      }
      return;
    }

    ensurePlugin();

    if (!query) {
      const view = getView();
      if (view) {
        const text = getSelectionText(view);
        if (text.length > 0 && text.length < 200) {
          setQuery(text);
        }
      }
    }

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !pluginRegistered.current) return;
    const view = getView();
    if (!view) return;

    const result = setSearchQuery(view, query, caseSensitive);
    setMatchInfo(result.matchCount, result.activeMatchIndex, result.selectedCount);
  }, [query, caseSensitive, isOpen, getView, setMatchInfo]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        const view = getView();
        if (!view) return;
        const result = selectNextMatch(view);
        setMatchInfo(result.matchCount, result.activeMatchIndex, result.selectedCount);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, getView, setMatchInfo]);

  const handleNavigate = useCallback(
    (direction: "next" | "prev") => {
      const view = getView();
      if (!view) return;
      const result = navigateMatch(view, direction);
      setMatchInfo(result.matchCount, result.activeMatchIndex, result.selectedCount);
    },
    [getView, setMatchInfo]
  );

  const handleReplace = useCallback(() => {
    const view = getView();
    if (!view) return;
    const result = replaceCurrentMatch(view, replaceText);
    setMatchInfo(result.matchCount, result.activeMatchIndex, result.selectedCount);
  }, [getView, replaceText, setMatchInfo]);

  const handleReplaceSelected = useCallback(() => {
    const view = getView();
    if (!view) return;
    const result = replaceSelectedMatches(view, replaceText);
    setMatchInfo(result.matchCount, result.activeMatchIndex, result.selectedCount);
  }, [getView, replaceText, setMatchInfo]);

  const handleReplaceAll = useCallback(() => {
    const view = getView();
    if (!view) return;
    const result = replaceAllMatches(view, replaceText);
    setMatchInfo(result.matchCount, result.activeMatchIndex, result.selectedCount);
  }, [getView, replaceText, setMatchInfo]);

  const handleSelectAll = useCallback(() => {
    const view = getView();
    if (!view) return;
    const result = selectAllMatches(view);
    setMatchInfo(result.matchCount, result.activeMatchIndex, result.selectedCount);
  }, [getView, setMatchInfo]);

  const handleClose = useCallback(() => {
    close();
    const view = getView();
    view?.focus();
  }, [close, getView]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleNavigate(e.shiftKey ? "prev" : "next");
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    },
    [handleNavigate, handleClose]
  );

  const handleReplaceKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (selectedCount > 0) {
          handleReplaceSelected();
        } else {
          handleReplace();
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    },
    [handleReplace, handleReplaceSelected, handleClose, selectedCount]
  );

  if (!isOpen) return null;

  const matchLabel =
    matchCount === 0
      ? query
        ? "결과 없음"
        : ""
      : `${activeMatchIndex + 1} / ${matchCount}`;

  return (
    <div className="absolute right-4 top-2 z-40 flex flex-col gap-1.5 rounded-lg border border-border bg-background p-2 shadow-lg">
      {/* Search row */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleReplace}
          className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          title="바꾸기 토글"
        >
          <ChevronDown
            size={14}
            className={`transition-transform ${showReplace ? "rotate-0" : "-rotate-90"}`}
          />
        </button>

        <div className="relative flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="찾기"
            className="h-7 w-48 rounded border border-border bg-background px-2 pr-16 text-sm outline-none focus:border-foreground/30"
          />
          <div className="absolute right-1 flex items-center gap-0.5">
            <span className="mr-0.5 text-[11px] text-muted-foreground">
              {matchLabel}
            </span>
            <button
              type="button"
              onClick={toggleCaseSensitive}
              className={`flex size-5 items-center justify-center rounded text-xs transition-colors ${
                caseSensitive
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              }`}
              title="대소문자 구분"
            >
              <CaseSensitive size={14} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleNavigate("prev")}
          disabled={matchCount === 0}
          className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30"
          title="이전 (Shift+Enter)"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => handleNavigate("next")}
          disabled={matchCount === 0}
          className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30"
          title="다음 (Enter)"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          title="닫기 (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* Selected count indicator */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 pl-7">
          <span className="text-[11px] text-indigo-500">
            {selectedCount}개 선택됨
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            모두 선택
          </button>
        </div>
      )}

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-1 pl-7">
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={handleReplaceKeyDown}
            placeholder="바꾸기"
            className="h-7 w-48 rounded border border-border bg-background px-2 text-sm outline-none focus:border-foreground/30"
          />
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={handleReplaceSelected}
              className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-indigo-500 transition-colors hover:bg-indigo-50"
              title={`선택한 ${selectedCount}개 바꾸기`}
            >
              <Replace size={13} />
              <span>{selectedCount}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReplace}
              disabled={matchCount === 0}
              className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30"
              title="바꾸기"
            >
              <Replace size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={matchCount === 0}
            className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30"
            title="모두 바꾸기"
          >
            <ReplaceAll size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
