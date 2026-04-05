/**
 * ProseMirror search plugin for Find & Replace + Cmd+D multi-select.
 *
 * Uses @tiptap/pm which re-exports ProseMirror packages.
 * TypeScript may show import errors but Vite resolves these
 * correctly at build time via TipTap's dependency chain.
 */

// @ts-ignore - resolved at runtime via @tiptap/pm
import { Plugin, PluginKey } from "@tiptap/pm/state";
// @ts-ignore - resolved at runtime via @tiptap/pm
import { Decoration, DecorationSet } from "@tiptap/pm/view";

interface SearchMatch {
  from: number;
  to: number;
}

interface SearchPluginState {
  query: string;
  caseSensitive: boolean;
  matches: SearchMatch[];
  activeMatchIndex: number;
  selectedIndices: Set<number>;
  decorations: any;
}

const searchPluginKey = new PluginKey("search");

function findMatches(
  doc: any,
  query: string,
  caseSensitive: boolean
): SearchMatch[] {
  if (!query) return [];

  const matches: SearchMatch[] = [];
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  doc.descendants((node: any, pos: number) => {
    if (!node.isText || !node.text) return;

    const text = caseSensitive ? node.text : node.text.toLowerCase();
    let index = 0;

    while (index < text.length) {
      const found = text.indexOf(searchQuery, index);
      if (found === -1) break;
      matches.push({ from: pos + found, to: pos + found + query.length });
      index = found + 1;
    }
  });

  return matches;
}

function buildDecorations(
  doc: any,
  matches: SearchMatch[],
  activeMatchIndex: number,
  selectedIndices: Set<number>
): any {
  if (matches.length === 0) return DecorationSet.empty;

  const decorations = matches.map((match: SearchMatch, i: number) => {
    let cls = "search-highlight";
    if (selectedIndices.has(i)) {
      cls += " search-highlight-selected";
    }
    if (i === activeMatchIndex) {
      cls += " search-highlight-active";
    }
    return Decoration.inline(match.from, match.to, { class: cls });
  });

  return DecorationSet.create(doc, decorations);
}

export function createSearchPlugin(): any {
  return new Plugin({
    key: searchPluginKey,
    state: {
      init(): SearchPluginState {
        return {
          query: "",
          caseSensitive: false,
          matches: [],
          activeMatchIndex: -1,
          selectedIndices: new Set(),
          decorations: DecorationSet.empty,
        };
      },
      apply(tr: any, prev: SearchPluginState): SearchPluginState {
        // New search query
        const meta = tr.getMeta(searchPluginKey);
        if (meta) {
          const { query, caseSensitive } = meta;
          const matches = findMatches(tr.doc, query, caseSensitive);
          const activeMatchIndex = matches.length > 0 ? 0 : -1;
          const selectedIndices = new Set<number>();
          return {
            query,
            caseSensitive,
            matches,
            activeMatchIndex,
            selectedIndices,
            decorations: buildDecorations(
              tr.doc,
              matches,
              activeMatchIndex,
              selectedIndices
            ),
          };
        }

        // Navigate next/prev
        const navigate = tr.getMeta("searchNavigate");
        if (navigate && prev.matches.length > 0) {
          let idx = prev.activeMatchIndex;
          if (navigate === "next") {
            idx = (idx + 1) % prev.matches.length;
          } else {
            idx = (idx - 1 + prev.matches.length) % prev.matches.length;
          }
          return {
            ...prev,
            activeMatchIndex: idx,
            decorations: buildDecorations(
              tr.doc,
              prev.matches,
              idx,
              prev.selectedIndices
            ),
          };
        }

        // Cmd+D: select next match
        const selectNext = tr.getMeta("searchSelectNext");
        if (selectNext && prev.matches.length > 0) {
          const newSelected = new Set(prev.selectedIndices);
          // First Cmd+D: select current active match
          if (newSelected.size === 0) {
            newSelected.add(prev.activeMatchIndex);
          }
          // Find next unselected match
          let nextIdx = prev.activeMatchIndex;
          for (let i = 0; i < prev.matches.length; i++) {
            nextIdx = (nextIdx + 1) % prev.matches.length;
            if (!newSelected.has(nextIdx)) {
              newSelected.add(nextIdx);
              return {
                ...prev,
                activeMatchIndex: nextIdx,
                selectedIndices: newSelected,
                decorations: buildDecorations(
                  tr.doc,
                  prev.matches,
                  nextIdx,
                  newSelected
                ),
              };
            }
          }
          // All matches already selected
          return {
            ...prev,
            selectedIndices: newSelected,
            decorations: buildDecorations(
              tr.doc,
              prev.matches,
              prev.activeMatchIndex,
              newSelected
            ),
          };
        }

        // Update selected indices directly
        const setSelected = tr.getMeta("searchSetSelected");
        if (setSelected) {
          const newSelected = setSelected as Set<number>;
          return {
            ...prev,
            selectedIndices: newSelected,
            decorations: buildDecorations(
              tr.doc,
              prev.matches,
              prev.activeMatchIndex,
              newSelected
            ),
          };
        }

        // Doc changed while searching — re-run search
        if (tr.docChanged && prev.query) {
          const matches = findMatches(tr.doc, prev.query, prev.caseSensitive);
          const activeMatchIndex =
            matches.length > 0
              ? Math.min(prev.activeMatchIndex, matches.length - 1)
              : -1;
          // Reset selections on doc change (positions shifted)
          const selectedIndices = new Set<number>();
          return {
            ...prev,
            matches,
            activeMatchIndex,
            selectedIndices,
            decorations: buildDecorations(
              tr.doc,
              matches,
              activeMatchIndex,
              selectedIndices
            ),
          };
        }

        return prev;
      },
    },
    props: {
      decorations(state: any) {
        return searchPluginKey.getState(state)?.decorations;
      },
    },
  });
}

export function getSearchState(state: any): SearchPluginState | undefined {
  return searchPluginKey.getState(state);
}

export function setSearchQuery(
  view: any,
  query: string,
  caseSensitive: boolean
): { matchCount: number; activeMatchIndex: number; selectedCount: number } {
  const tr = view.state.tr.setMeta(searchPluginKey, { query, caseSensitive });
  view.dispatch(tr);

  const pluginState = getSearchState(view.state);
  return {
    matchCount: pluginState?.matches.length ?? 0,
    activeMatchIndex: pluginState?.activeMatchIndex ?? -1,
    selectedCount: pluginState?.selectedIndices.size ?? 0,
  };
}

export function navigateMatch(
  view: any,
  direction: "next" | "prev"
): { matchCount: number; activeMatchIndex: number; selectedCount: number } {
  const tr = view.state.tr.setMeta("searchNavigate", direction);
  view.dispatch(tr);

  const pluginState = getSearchState(view.state);
  if (pluginState && pluginState.activeMatchIndex >= 0) {
    requestAnimationFrame(() => {
      const el = view.dom.querySelector(".search-highlight-active");
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return {
      matchCount: pluginState.matches.length,
      activeMatchIndex: pluginState.activeMatchIndex,
      selectedCount: pluginState.selectedIndices.size,
    };
  }

  return {
    matchCount: pluginState?.matches.length ?? 0,
    activeMatchIndex: pluginState?.activeMatchIndex ?? -1,
    selectedCount: pluginState?.selectedIndices.size ?? 0,
  };
}

/**
 * Cmd+D: select next occurrence.
 * Returns updated match info + scrolls to newly selected match.
 */
export function selectNextMatch(
  view: any
): { matchCount: number; activeMatchIndex: number; selectedCount: number } {
  const tr = view.state.tr.setMeta("searchSelectNext", true);
  view.dispatch(tr);

  const pluginState = getSearchState(view.state);
  if (pluginState && pluginState.activeMatchIndex >= 0) {
    requestAnimationFrame(() => {
      // Scroll to the newly active (just-selected) match
      const els = view.dom.querySelectorAll(".search-highlight-selected");
      const active = view.dom.querySelector(
        ".search-highlight-active.search-highlight-selected"
      );
      (active ?? els[els.length - 1])?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    });
  }

  return {
    matchCount: pluginState?.matches.length ?? 0,
    activeMatchIndex: pluginState?.activeMatchIndex ?? -1,
    selectedCount: pluginState?.selectedIndices.size ?? 0,
  };
}

/**
 * Select all matches at once (like Cmd+Shift+L in VS Code).
 */
export function selectAllMatches(
  view: any
): { matchCount: number; activeMatchIndex: number; selectedCount: number } {
  const pluginState = getSearchState(view.state);
  if (!pluginState || pluginState.matches.length === 0) {
    return { matchCount: 0, activeMatchIndex: -1, selectedCount: 0 };
  }

  const allIndices = new Set<number>();
  for (let i = 0; i < pluginState.matches.length; i++) {
    allIndices.add(i);
  }

  const tr = view.state.tr.setMeta("searchSetSelected", allIndices);
  view.dispatch(tr);

  const newState = getSearchState(view.state);
  return {
    matchCount: newState?.matches.length ?? 0,
    activeMatchIndex: newState?.activeMatchIndex ?? -1,
    selectedCount: newState?.selectedIndices.size ?? 0,
  };
}

export function replaceCurrentMatch(
  view: any,
  replacement: string
): { matchCount: number; activeMatchIndex: number; selectedCount: number } {
  const pluginState = getSearchState(view.state);
  if (!pluginState || pluginState.activeMatchIndex < 0) {
    return { matchCount: 0, activeMatchIndex: -1, selectedCount: 0 };
  }

  const match = pluginState.matches[pluginState.activeMatchIndex];
  const tr = view.state.tr.insertText(replacement, match.from, match.to);
  view.dispatch(tr);

  const newState = getSearchState(view.state);
  return {
    matchCount: newState?.matches.length ?? 0,
    activeMatchIndex: newState?.activeMatchIndex ?? -1,
    selectedCount: newState?.selectedIndices.size ?? 0,
  };
}

/**
 * Replace only the Cmd+D selected matches.
 * If none selected, replaces all (fallback).
 */
export function replaceSelectedMatches(
  view: any,
  replacement: string
): { matchCount: number; activeMatchIndex: number; selectedCount: number } {
  const pluginState = getSearchState(view.state);
  if (!pluginState || pluginState.matches.length === 0) {
    return { matchCount: 0, activeMatchIndex: -1, selectedCount: 0 };
  }

  const indices =
    pluginState.selectedIndices.size > 0
      ? Array.from(pluginState.selectedIndices).sort((a, b) => b - a)
      : pluginState.matches.map((_, i) => i).reverse();

  let tr = view.state.tr;
  for (const i of indices) {
    const match = pluginState.matches[i];
    tr = tr.insertText(replacement, match.from, match.to);
  }
  view.dispatch(tr);

  const newState = getSearchState(view.state);
  return {
    matchCount: newState?.matches.length ?? 0,
    activeMatchIndex: newState?.activeMatchIndex ?? -1,
    selectedCount: newState?.selectedIndices.size ?? 0,
  };
}

export function replaceAllMatches(
  view: any,
  replacement: string
): { matchCount: number; activeMatchIndex: number; selectedCount: number } {
  const pluginState = getSearchState(view.state);
  if (!pluginState || pluginState.matches.length === 0) {
    return { matchCount: 0, activeMatchIndex: -1, selectedCount: 0 };
  }

  let tr = view.state.tr;
  for (let i = pluginState.matches.length - 1; i >= 0; i--) {
    const match = pluginState.matches[i];
    tr = tr.insertText(replacement, match.from, match.to);
  }
  view.dispatch(tr);

  const newState = getSearchState(view.state);
  return {
    matchCount: newState?.matches.length ?? 0,
    activeMatchIndex: newState?.activeMatchIndex ?? -1,
    selectedCount: newState?.selectedIndices.size ?? 0,
  };
}

export function clearSearch(view: any): void {
  const tr = view.state.tr.setMeta(searchPluginKey, {
    query: "",
    caseSensitive: false,
  });
  view.dispatch(tr);
}

/**
 * Get the word at the current cursor position, or the selected text.
 */
export function getSelectionText(view: any): string {
  const { from, to } = view.state.selection;
  if (from !== to) {
    return view.state.doc.textBetween(from, to, " ");
  }
  // No selection — expand to word boundaries
  const $pos = view.state.doc.resolve(from);
  const node = $pos.parent;
  if (!node.isTextblock) return "";

  const text = node.textContent;
  const offset = $pos.parentOffset;

  // Find word boundaries (letters, numbers, hangul, CJK)
  const wordChars = /[\w\u3131-\uD79D\u4E00-\u9FFF]/;
  let start = offset;
  let end = offset;
  while (start > 0 && wordChars.test(text[start - 1])) start--;
  while (end < text.length && wordChars.test(text[end])) end++;

  if (start === end) return "";

  // Convert parent-relative offset to absolute position
  const nodeStart = $pos.start();
  return view.state.doc.textBetween(nodeStart + start, nodeStart + end, " ");
}
