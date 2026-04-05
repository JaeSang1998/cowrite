import {
  layoutWithLines,
  prepareWithSegments,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";

const PREPARE_OPTIONS = { whiteSpace: "pre-wrap" as const };
const VERY_WIDE_WIDTH = 100000;

const graphemeSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export interface SelectionFragment {
  x: number;
  y: number;
  width: number;
  height: number;
  lineIndex: number;
  start: number;
  end: number;
}

export interface SelectionLayoutResult {
  fragments: SelectionFragment[];
  pathStart: { x: number; y: number };
  pathEnd: { x: number; y: number };
  resolvedStart: number;
  resolvedEnd: number;
}

export interface SelectionLayoutInput {
  blockId: string;
  start: number;
  end: number;
  quote?: string;
  container: HTMLElement;
}

export interface ResolvedOffsets {
  start: number;
  end: number;
}

export interface LineOffsetRange {
  lineIndex: number;
  start: number;
  end: number;
}

interface SegmentCursorIndex {
  segmentStarts: number[];
  graphemeStartsBySegment: number[][];
  totalLength: number;
}

function safeAttrValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function collectTextNodes(root: HTMLElement): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    textNodes.push(node as Text);
    node = walker.nextNode();
  }

  return textNodes;
}

function getBlockTextRoot(container: HTMLElement, blockId: string): HTMLElement | null {
  const blockEl = container.querySelector<HTMLElement>(
    `[data-node-type="blockContainer"][data-id="${safeAttrValue(blockId)}"]`
  );
  if (!blockEl) return null;

  const contentRoot =
    blockEl.querySelector<HTMLElement>(
      '.bn-inline-content, [data-content-type], [data-node-type="blockContent"]'
    ) ?? blockEl;

  return contentRoot;
}

function getBlockText(root: HTMLElement): string {
  return collectTextNodes(root).map((n) => n.textContent ?? "").join("");
}

function parsePx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveLineHeightPx(lineHeight: string, fontSizePx: number): number {
  if (!lineHeight || lineHeight === "normal") {
    return fontSizePx * 1.2;
  }

  if (lineHeight.endsWith("px")) {
    return parsePx(lineHeight);
  }

  const ratio = Number.parseFloat(lineHeight);
  if (Number.isFinite(ratio)) {
    return ratio * fontSizePx;
  }

  return fontSizePx * 1.2;
}

function buildFontShorthand(style: CSSStyleDeclaration): string {
  const fontStyle = style.fontStyle || "normal";
  const fontVariant = style.fontVariant || "normal";
  const fontWeight = style.fontWeight || "400";
  const fontSize = style.fontSize || "16px";
  const fontFamily = style.fontFamily || "sans-serif";
  return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize} ${fontFamily}`;
}

function getGraphemeStarts(text: string): number[] {
  if (!text) return [];

  if (!graphemeSegmenter) {
    const starts: number[] = [];
    for (let i = 0; i < text.length; i += 1) {
      starts.push(i);
    }
    return starts;
  }

  const starts: number[] = [];
  for (const segment of graphemeSegmenter.segment(text)) {
    starts.push(segment.index);
  }
  return starts;
}

function buildSegmentCursorIndex(prepared: PreparedTextWithSegments): SegmentCursorIndex {
  const segmentStarts: number[] = [];
  const graphemeStartsBySegment: number[][] = [];
  let offset = 0;

  for (const segment of prepared.segments) {
    segmentStarts.push(offset);
    graphemeStartsBySegment.push(getGraphemeStarts(segment));
    offset += segment.length;
  }

  return {
    segmentStarts,
    graphemeStartsBySegment,
    totalLength: offset,
  };
}

function graphemeIndexToCodeUnitOffset(
  segmentText: string,
  graphemeStarts: number[],
  graphemeIndex: number
): number {
  if (graphemeIndex <= 0) return 0;
  if (graphemeStarts.length === 0) return segmentText.length;
  if (graphemeIndex >= graphemeStarts.length) return segmentText.length;
  return graphemeStarts[graphemeIndex] ?? segmentText.length;
}

function cursorToOffset(
  cursor: LayoutCursor,
  prepared: PreparedTextWithSegments,
  index: SegmentCursorIndex
): number {
  const segIdx = Math.max(0, Math.min(cursor.segmentIndex, prepared.segments.length));
  if (segIdx >= prepared.segments.length) {
    return index.totalLength;
  }

  const segmentText = prepared.segments[segIdx] ?? "";
  const segmentStart = index.segmentStarts[segIdx] ?? index.totalLength;
  const graphemeStarts = index.graphemeStartsBySegment[segIdx] ?? [];

  const relativeOffset = graphemeIndexToCodeUnitOffset(
    segmentText,
    graphemeStarts,
    cursor.graphemeIndex
  );

  return segmentStart + relativeOffset;
}

function measureInlineWidth(
  text: string,
  font: string,
  lineHeightPx: number,
  cache: Map<string, number>
): number {
  if (!text) return 0;
  const key = `${font}__${text}`;
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const prepared = prepareWithSegments(text, font, PREPARE_OPTIONS);
  const result = layoutWithLines(prepared, VERY_WIDE_WIDTH, lineHeightPx);
  const width = result.lines[0]?.width ?? 0;
  cache.set(key, width);
  return width;
}

export function resolveSelectionOffsets(
  text: string,
  start: number,
  end: number,
  quote?: string
): ResolvedOffsets | null {
  const boundedStart = Math.max(0, Math.min(start, text.length));
  const boundedEnd = Math.max(boundedStart, Math.min(end, text.length));
  if (boundedEnd <= boundedStart) return null;

  const trimmedQuote = quote?.trim();
  if (!trimmedQuote) {
    return { start: boundedStart, end: boundedEnd };
  }
  const targetQuote = quote ?? "";

  const direct = text.slice(boundedStart, boundedEnd);
  if (direct === targetQuote) {
    return { start: boundedStart, end: boundedEnd };
  }

  let bestStart = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  let fromIndex = 0;

  while (fromIndex <= text.length) {
    const found = text.indexOf(targetQuote, fromIndex);
    if (found === -1) break;

    const distance = Math.abs(found - boundedStart);
    if (distance < bestDistance) {
      bestStart = found;
      bestDistance = distance;
    }

    fromIndex = found + 1;
  }

  if (bestStart === -1) {
    return null;
  }

  return {
    start: bestStart,
    end: bestStart + targetQuote.length,
  };
}

export function splitRangeAcrossLines(
  lines: LineOffsetRange[],
  rangeStart: number,
  rangeEnd: number
): Array<{ lineIndex: number; start: number; end: number }> {
  const slices: Array<{ lineIndex: number; start: number; end: number }> = [];
  for (const line of lines) {
    if (line.end <= rangeStart || line.start >= rangeEnd) continue;
    const start = Math.max(line.start, rangeStart);
    const end = Math.min(line.end, rangeEnd);
    if (end > start) {
      slices.push({ lineIndex: line.lineIndex, start, end });
    }
  }
  return slices;
}

export function layoutSelectionRange(
  input: SelectionLayoutInput
): SelectionLayoutResult | null {
  const root = getBlockTextRoot(input.container, input.blockId);
  if (!root) return null;

  const blockText = getBlockText(root);
  const resolved = resolveSelectionOffsets(
    blockText,
    input.start,
    input.end,
    input.quote
  );
  if (!resolved) return null;

  const style = window.getComputedStyle(root);
  const fontSizePx = parsePx(style.fontSize || "16px") || 16;
  const lineHeightPx = resolveLineHeightPx(style.lineHeight, fontSizePx);
  const font = buildFontShorthand(style);

  const paddingLeft = parsePx(style.paddingLeft);
  const paddingRight = parsePx(style.paddingRight);
  const paddingTop = parsePx(style.paddingTop);
  const widthFromClient = root.clientWidth - paddingLeft - paddingRight;
  const widthFromRect = root.getBoundingClientRect().width - paddingLeft - paddingRight;
  const contentWidth = Math.max(1, widthFromClient || widthFromRect || 1);

  const prepared = prepareWithSegments(blockText, font, PREPARE_OPTIONS);
  const lines = layoutWithLines(prepared, contentWidth, lineHeightPx).lines;
  if (lines.length === 0) return null;

  const cursorIndex = buildSegmentCursorIndex(prepared);
  const lineRanges: LineOffsetRange[] = lines.map((line, lineIndex) => ({
    lineIndex,
    start: cursorToOffset(line.start, prepared, cursorIndex),
    end: cursorToOffset(line.end, prepared, cursorIndex),
  }));

  const overlappingSlices = splitRangeAcrossLines(
    lineRanges,
    resolved.start,
    resolved.end
  );
  if (overlappingSlices.length === 0) return null;

  const containerRect = input.container.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const originX =
    rootRect.left - containerRect.left + input.container.scrollLeft + paddingLeft;
  const originY =
    rootRect.top - containerRect.top + input.container.scrollTop + paddingTop;

  const widthCache = new Map<string, number>();
  const fragments: SelectionFragment[] = overlappingSlices.map((slice) => {
    const line = lineRanges[slice.lineIndex];
    const prefix = blockText.slice(line.start, slice.start);
    const selected = blockText.slice(slice.start, slice.end);

    const prefixWidth = measureInlineWidth(prefix, font, lineHeightPx, widthCache);
    const selectedWidth = measureInlineWidth(
      selected,
      font,
      lineHeightPx,
      widthCache
    );

    return {
      x: originX + prefixWidth,
      y: originY + slice.lineIndex * lineHeightPx,
      width: Math.max(1, selectedWidth),
      height: lineHeightPx,
      lineIndex: slice.lineIndex,
      start: slice.start,
      end: slice.end,
    };
  });

  const first = fragments[0];
  const last = fragments[fragments.length - 1];

  return {
    fragments,
    pathStart: { x: first.x, y: first.y },
    pathEnd: { x: last.x + last.width, y: last.y },
    resolvedStart: resolved.start,
    resolvedEnd: resolved.end,
  };
}
