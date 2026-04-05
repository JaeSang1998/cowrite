import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CanvasWidth = "narrow" | "medium" | "full";
export type FontFamily = "serif" | "sans" | "mono";

export const fontFamilies: Record<FontFamily, { label: string; value: string }> = {
  serif: {
    label: "명조",
    value: '"Georgia", "Noto Serif KR", serif'
  },
  sans: {
    label: "고딕",
    value: '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'
  },
  mono: {
    label: "모노",
    value: '"JetBrains Mono", "D2Coding", "Noto Sans Mono", monospace'
  }
};

interface DisplaySettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  canvasWidth: CanvasWidth;
  fontFamily: FontFamily;

  setFontSize: (v: number) => void;
  setLineHeight: (v: number) => void;
  setLetterSpacing: (v: number) => void;
  setCanvasWidth: (v: CanvasWidth) => void;
  setFontFamily: (v: FontFamily) => void;
  reset: () => void;
}

const defaults = {
  fontSize: 1.0625,
  lineHeight: 1.85,
  letterSpacing: -0.01,
  canvasWidth: "medium" as CanvasWidth,
  fontFamily: "serif" as FontFamily
};

export const useDisplayStore = create<DisplaySettings>()(
  persist(
    (set) => ({
      ...defaults,
      setFontSize: (v) => set({ fontSize: v }),
      setLineHeight: (v) => set({ lineHeight: v }),
      setLetterSpacing: (v) => set({ letterSpacing: v }),
      setCanvasWidth: (v) => set({ canvasWidth: v }),
      setFontFamily: (v) => set({ fontFamily: v }),
      reset: () => set(defaults)
    }),
    { name: "cowrite-display-settings" }
  )
);

export const canvasMaxWidths: Record<CanvasWidth, string> = {
  narrow: "720px",
  medium: "860px",
  full: "100%"
};
