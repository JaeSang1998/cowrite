import { useEffect, useRef, useState } from "react";
import { useCursorStore, type AgentCursorState, type CursorPhase } from "@/store/cursorStore";
import {
  layoutSelectionRange,
  type SelectionFragment,
} from "@/lib/selectionLayout";
import {
  AgentCursor,
  CursorPointer,
  CursorBody,
  CursorName,
  CursorMessage
} from "./AgentCursor";

/* ── Timing (ms) ── */
const TIMING = {
  entering: 600,
  moving: 900,
  selecting: 600,
  commenting: 2200,
  idle: 1000,
  exiting: 400
};

const COMMENT_BUBBLE_WIDTH = 260;
const COMMENT_BUBBLE_MARGIN = 12;
const EDGE_PADDING = 8;

function getEditorContainer(): HTMLElement | null {
  return document.querySelector("[data-editor-container]") as HTMLElement | null;
}

function computeBubbleShift(cursorX: number, container: HTMLElement): number {
  const visibleLeft = container.scrollLeft;
  const visibleRight = visibleLeft + container.clientWidth;
  const bubbleLeft = cursorX + COMMENT_BUBBLE_MARGIN;
  const bubbleRight = bubbleLeft + COMMENT_BUBBLE_WIDTH;

  if (bubbleRight <= visibleRight - EDGE_PADDING) {
    return 0;
  }

  let shift = (visibleRight - EDGE_PADDING) - bubbleRight;
  const shiftedLeft = bubbleLeft + shift;

  if (shiftedLeft < visibleLeft + EDGE_PADDING) {
    shift += (visibleLeft + EDGE_PADDING) - shiftedLeft;
  }

  return shift;
}

/**
 * Fully self-contained animated cursor driven by a ref-based
 * async sequence. No external state dependencies — avoids
 * re-render cancellation issues entirely.
 */
function AnimatedCursor({ cursor }: { cursor: AgentCursorState }) {
  const removeCursor = useCursorStore((s) => s.removeCursor);

  // Capture initial props in ref — never changes
  const initRef = useRef(cursor);

  const [phase, setPhase] = useState<CursorPhase>("entering");
  const [x, setX] = useState(cursor.x);
  const [y, setY] = useState(cursor.y);
  const [fragments, setFragments] = useState<SelectionFragment[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [bubbleShiftX, setBubbleShiftX] = useState(0);

  // Run animation ONCE on mount — empty deps, no re-trigger
  useEffect(() => {
    let cancelled = false;
    const c = initRef.current;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const waitFrames = (n: number) =>
      new Promise<void>((resolve) => {
        let count = 0;
        const tick = () => {
          count++;
          if (count >= n) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

    (async () => {
      // ── entering ──
      await sleep(TIMING.entering);
      if (cancelled) return;

      const container = getEditorContainer();
      if (!container) {
        removeCursor(c.id);
        return;
      }

      const target = layoutSelectionRange({
        blockId: c.blockId,
        start: c.start,
        end: c.end,
        quote: c.quote,
        container,
      });
      if (!target) {
        removeCursor(c.id);
        return;
      }

      setFragments(target.fragments);
      setBubbleShiftX(computeBubbleShift(target.pathEnd.x, container));

      // ── moving: enable transition, then update position ──
      setIsMoving(true);
      setPhase("moving");

      // Wait 3 frames so the browser paints the current position
      // with transition enabled before we change x/y
      await waitFrames(3);
      if (cancelled) return;

      setX(target.pathStart.x);
      setY(target.pathStart.y);

      await sleep(TIMING.moving);
      if (cancelled) return;
      setIsMoving(false);

      // ── selecting: cursor follows highlight from left → right ──
      setPhase("selecting");
      setIsSelecting(true);
      await waitFrames(2);
      if (cancelled) return;

      // Move cursor to the right end of the selection
      setX(target.pathEnd.x);
      setY(target.pathEnd.y);

      await sleep(TIMING.selecting);
      if (cancelled) return;
      setIsSelecting(false);

      // ── commenting ──
      setPhase("commenting");
      await sleep(TIMING.commenting);
      if (cancelled) return;

      // ── idle ──
      setPhase("idle");
      await sleep(TIMING.idle);
      if (cancelled) return;

      // ── exiting ──
      setPhase("exiting");
      await sleep(TIMING.exiting);
      if (cancelled) return;

      removeCursor(c.id);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once

  const isVisible = phase !== "exiting";
  const showSelection = phase === "selecting" || phase === "commenting" || phase === "idle";
  const showComment = phase === "commenting" || phase === "idle";

  return (
    <>
      {showSelection &&
        fragments.map((fragment, index) => (
          <div
            key={`${cursor.id}-fragment-${index}`}
            className={`absolute rounded-sm ${phase === "selecting" ? "agent-selection-fragment--sweep" : ""}`}
            style={{
              left: fragment.x,
              top: fragment.y,
              width: fragment.width,
              height: fragment.height,
              backgroundColor: cursor.personaColor,
              opacity: phase === "selecting" ? 0.22 : 0.2,
            }}
          />
        ))}

      <AgentCursor
        color={cursor.personaColor}
        style={{
          left: 0,
          top: 0,
          opacity: isVisible ? 1 : 0,
          transform: `translate3d(${x}px, ${y}px, 0)`,
          willChange: "transform, opacity",
          zIndex: 50,
          transition: isMoving
            ? `transform ${TIMING.moving}ms cubic-bezier(0.4,0,0.2,1), opacity 300ms`
            : isSelecting
              ? `transform ${TIMING.selecting}ms linear, opacity 300ms`
              : "opacity 300ms"
        }}
      >
        <CursorPointer />
        <CursorBody
          style={{
            transform: `translate3d(${bubbleShiftX}px, 0, 0)`,
            transition: "transform 180ms ease-out",
          }}
        >
          <CursorName>{cursor.personaName}</CursorName>
          {showComment && (
            <CursorMessage>
              <span className="mt-1 block max-w-[220px] whitespace-normal text-[11px] leading-tight">
                {cursor.commentBody}
              </span>
            </CursorMessage>
          )}
        </CursorBody>
      </AgentCursor>
    </>
  );
}

export function AgentCursorOverlay() {
  const cursors = useCursorStore((s) => s.cursors);

  if (cursors.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {cursors.map((cursor) => (
        <AnimatedCursor key={cursor.id} cursor={cursor} />
      ))}
    </div>
  );
}
