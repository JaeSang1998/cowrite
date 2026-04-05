import { useCallback, useEffect, useRef, useState } from "react";
import { SideMenuController, useBlockNoteEditor, type SideMenuProps } from "@blocknote/react";
import { GripVertical } from "lucide-react";

/**
 * Custom side menu with pointer-event-based block drag.
 * Replaces BlockNote's default HTML5 DnD which is unreliable in Tauri WebView.
 */
export function BlockDragHandle() {
  return <SideMenuController sideMenu={CustomSideMenu} />;
}

function CustomSideMenu(props: SideMenuProps<any, any, any>) {
  const editor = useBlockNoteEditor();
  const handleRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    blockId: string;
    offsetX: number;
    offsetY: number;
    ghost: HTMLElement | null;
    indicator: HTMLElement | null;
    targetBlockId: string | null;
    placement: "before" | "after";
  } | null>(null);

  const getBlockElements = useCallback(() => {
    const editorEl = editor.domElement;
    if (!editorEl) return [];
    return Array.from(
      editorEl.querySelectorAll<HTMLElement>("[data-node-type='blockContainer'][data-id]")
    );
  }, [editor]);

  const findClosestBlock = useCallback(
    (y: number) => {
      const blocks = getBlockElements();
      let closest: { el: HTMLElement; placement: "before" | "after" } | null = null;
      let minDist = Infinity;

      for (const el of blocks) {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(y - midY);

        if (dist < minDist) {
          minDist = dist;
          closest = {
            el,
            placement: y < midY ? "before" : "after",
          };
        }
      }

      return closest;
    },
    [getBlockElements]
  );

  const createGhost = useCallback((blockId: string) => {
    const blockEl = document.querySelector(
      `[data-node-type='blockContainer'][data-id='${blockId}']`
    ) as HTMLElement | null;
    if (!blockEl) return null;

    const ghost = blockEl.cloneNode(true) as HTMLElement;
    ghost.className = "block-drag-ghost";
    ghost.style.width = `${blockEl.offsetWidth}px`;
    document.body.appendChild(ghost);
    return ghost;
  }, []);

  const createIndicator = useCallback(() => {
    const indicator = document.createElement("div");
    indicator.className = "block-drag-indicator";
    document.body.appendChild(indicator);
    return indicator;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const blockId = props.block.id;
      props.freezeMenu();

      // Calculate offset from cursor to block's top-left so ghost stays in place
      const blockEl = document.querySelector(
        `[data-node-type='blockContainer'][data-id='${blockId}']`
      ) as HTMLElement | null;
      const blockRect = blockEl?.getBoundingClientRect();

      const ghost = createGhost(blockId);
      const indicator = createIndicator();

      const offsetX = blockRect ? e.clientX - blockRect.left : 0;
      const offsetY = blockRect ? e.clientY - blockRect.top : 0;

      if (ghost && blockRect) {
        ghost.style.left = `${blockRect.left}px`;
        ghost.style.top = `${blockRect.top}px`;
      }

      dragStateRef.current = {
        blockId,
        offsetX,
        offsetY,
        ghost,
        indicator,
        targetBlockId: null,
        placement: "after",
      };

      setIsDragging(true);

      // Dim the source block
      const sourceEl = document.querySelector(
        `[data-node-type='blockContainer'][data-id='${blockId}']`
      ) as HTMLElement | null;
      if (sourceEl) sourceEl.style.opacity = "0.3";

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [props, createGhost, createIndicator]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      // Move ghost — keep it anchored relative to where the user grabbed
      if (ds.ghost) {
        ds.ghost.style.left = `${e.clientX - ds.offsetX}px`;
        ds.ghost.style.top = `${e.clientY - ds.offsetY}px`;
      }

      // Find closest block for drop indicator
      const closest = findClosestBlock(e.clientY);
      if (closest && ds.indicator) {
        const targetId = closest.el.getAttribute("data-id");
        ds.targetBlockId = targetId;
        ds.placement = closest.placement;

        const rect = closest.el.getBoundingClientRect();
        const indicatorY =
          closest.placement === "before" ? rect.top - 1 : rect.bottom - 1;

        ds.indicator.style.top = `${indicatorY}px`;
        ds.indicator.style.left = `${rect.left}px`;
        ds.indicator.style.width = `${rect.width}px`;
        ds.indicator.style.display = "block";
      }
    },
    [findClosestBlock]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      // Clean up visuals
      if (ds.ghost) ds.ghost.remove();
      if (ds.indicator) ds.indicator.remove();

      // Restore source opacity
      const sourceEl = document.querySelector(
        `[data-node-type='blockContainer'][data-id='${ds.blockId}']`
      ) as HTMLElement | null;
      if (sourceEl) sourceEl.style.opacity = "";

      // Perform the move if target differs from source
      if (ds.targetBlockId && ds.targetBlockId !== ds.blockId) {
        try {
          const block = editor.getBlock(ds.blockId);
          if (block) {
            editor.removeBlocks([ds.blockId]);
            editor.insertBlocks([block], ds.targetBlockId, ds.placement);
          }
        } catch {
          // Block might have been removed already; ignore
        }
      }

      dragStateRef.current = null;
      setIsDragging(false);
      props.unfreezeMenu();

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [editor, props]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ds = dragStateRef.current;
      if (ds) {
        ds.ghost?.remove();
        ds.indicator?.remove();
      }
    };
  }, []);

  return (
    <div
      className="bn-side-menu"
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <button
        ref={handleRef}
        type="button"
        className="bn-button"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          border: "none",
          background: "none",
          color: "inherit",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <GripVertical size={20} data-test="dragHandle" />
      </button>
    </div>
  );
}
