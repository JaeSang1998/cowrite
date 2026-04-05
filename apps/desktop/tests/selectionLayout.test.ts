import { describe, expect, test } from "bun:test";
import {
  resolveSelectionOffsets,
  splitRangeAcrossLines,
  type LineOffsetRange,
} from "../src/lib/selectionLayout";

describe("resolveSelectionOffsets", () => {
  test("keeps the original range when quote matches exactly", () => {
    const text = "강화학습은 다양한 분야에서 주목받고 있습니다.";
    const quote = "다양한 분야";
    const start = text.indexOf(quote);
    const end = start + quote.length;

    expect(resolveSelectionOffsets(text, start, end, quote)).toEqual({
      start,
      end,
    });
  });

  test("re-searches quote when offsets are stale", () => {
    const text = "A B C B C D";
    const quote = "B C";

    // stale (wrong) range points to "C B"
    const repaired = resolveSelectionOffsets(text, 4, 7, quote);

    expect(repaired).toEqual({ start: 2, end: 5 });
  });

  test("returns null when quote cannot be found", () => {
    const text = "hello world";
    const resolved = resolveSelectionOffsets(text, 0, 5, "missing");
    expect(resolved).toBeNull();
  });
});

describe("splitRangeAcrossLines", () => {
  const lines: LineOffsetRange[] = [
    { lineIndex: 0, start: 0, end: 10 },
    { lineIndex: 1, start: 10, end: 20 },
    { lineIndex: 2, start: 20, end: 30 },
  ];

  test("splits one selection into line fragments", () => {
    const slices = splitRangeAcrossLines(lines, 6, 24);
    expect(slices).toEqual([
      { lineIndex: 0, start: 6, end: 10 },
      { lineIndex: 1, start: 10, end: 20 },
      { lineIndex: 2, start: 20, end: 24 },
    ]);
  });

  test("returns empty when selection does not overlap any line", () => {
    expect(splitRangeAcrossLines(lines, 40, 45)).toEqual([]);
  });
});
