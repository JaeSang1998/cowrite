/**
 * Shared utility: given a BlockNote block element and a character range,
 * returns precise DOMRect[] using the Range API.
 */

/** Walk only the editable text nodes inside a BlockNote block. */
function collectTextNodes(blockEl: HTMLElement): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    blockEl,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const inlineContent = parent.closest(
          ".bn-inline-content, [data-content-type]"
        );
        return inlineContent
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node);
  }
  return textNodes;
}

/** Map a character offset in the flat text to a (Text, offset) pair. */
function findTextPosition(
  textNodes: Text[],
  charIndex: number
): { node: Text; offset: number } | null {
  let accum = 0;
  for (const tn of textNodes) {
    if (accum + tn.length >= charIndex) {
      return { node: tn, offset: charIndex - accum };
    }
    accum += tn.length;
  }
  return null;
}

export interface TextRangeRects {
  rects: DOMRect[];
  /** Bounding rect that wraps all individual rects */
  bounds: DOMRect;
}

/**
 * Get precise pixel rects for a character range inside a BlockNote block.
 * Returns null if the block or range cannot be resolved.
 */
export function getTextRangeRects(
  blockId: string,
  start: number,
  end: number,
  container?: HTMLElement,
  /** If provided, verify that the DOM text at this range matches the quote. */
  expectedQuote?: string
): TextRangeRects | null {
  const root = container ?? document.body;
  const blockEl = root.querySelector(
    `[data-id="${blockId}"]`
  ) as HTMLElement | null;

  if (!blockEl) {
    console.warn(`[textRects] Block not found: data-id="${blockId}"`);
    return null;
  }

  const textNodes = collectTextNodes(blockEl);
  if (textNodes.length === 0) {
    console.warn(`[textRects] No text nodes in block "${blockId}"`);
    return null;
  }

  // Validate quote against actual DOM text if provided
  if (expectedQuote) {
    const fullText = textNodes.map((n) => n.textContent ?? "").join("");
    const actual = fullText.slice(start, end);
    // Trim both sides and compare — stale annotations won't match
    if (actual.trim() !== expectedQuote.trim()) {
      console.warn(`[textRects] Quote mismatch in "${blockId}" [${start}:${end}]`, { actual: actual.slice(0, 40), expected: expectedQuote.slice(0, 40) });
      return null;
    }
    // Also reject if the range covers most/all of the block (likely a stale patch annotation)
    if (actual.length > 0 && actual.length >= fullText.length * 0.9 && actual.length > 60) return null;
  }

  const startPos = findTextPosition(textNodes, start);
  const endPos = findTextPosition(textNodes, end);
  if (!startPos || !endPos) return null;

  try {
    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);

    const rects = Array.from(range.getClientRects());
    if (rects.length === 0) return null;

    const bounds = range.getBoundingClientRect();
    return { rects, bounds };
  } catch {
    return null;
  }
}

/**
 * Convert DOMRects from viewport-relative to container-relative coordinates.
 */
export function toContainerRelative(
  rects: DOMRect[],
  containerRect: DOMRect
): DOMRect[] {
  return rects.map(
    (r) =>
      new DOMRect(
        r.left - containerRect.left,
        r.top - containerRect.top,
        r.width,
        r.height
      )
  );
}
