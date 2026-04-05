import { useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { canonicalDocumentToBlockNote } from "@cowrite/writer-core";
import { useDocumentStore } from "@/store/documentStore";
import { useThreadStore } from "@/store/threadStore";
import { useDisplayStore, canvasMaxWidths, fontFamilies } from "@/store/displayStore";
import { createNewDocument, scanDocuments } from "@/lib/documents";
import { useEditorKeyboard } from "@/lib/useEditorKeyboard";
import { getTextRangeRects } from "@/lib/textRects";
import { WriterCanvas } from "./WriterCanvas";
import { DocumentTitle } from "./DocumentTitle";
import { ThreadPanelToggle } from "./ThreadPanelToggle";
import { PendingCommentHighlight } from "./InlineCommentInput";
import { DisplaySettingsPopover } from "./DisplaySettingsPopover";
import { AgentCursorOverlay } from "../cursor/AgentCursorOverlay";
import { AnnotationHighlightOverlay } from "../cursor/AnnotationHighlightOverlay";
import { ThreadPanel } from "../cursor/ThreadPanel";

function EmptyState() {
  const { loadDocument, setDocumentList } = useDocumentStore();

  const handleCreate = async () => {
    const result = await createNewDocument();
    if (result) {
      loadDocument(result.document, result.path);
      const docs = await scanDocuments();
      setDocumentList(docs);
    }
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">문서가 없습니다</p>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground/5"
        >
          <Plus size={16} />
          새 문서 만들기
        </button>
      </div>
    </div>
  );
}

export function EditorView() {
  const { document, documentPath, editorSeed, syncFromBlocks } = useDocumentStore();
  const showThreadPanel = useThreadStore((s) => s.showThreadPanel);
  const activeThreadId = useThreadStore((s) => s.activeThreadId);
  const { fontSize, lineHeight, letterSpacing, canvasWidth, fontFamily } = useDisplayStore();
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEditorKeyboard();

  // Scroll editor to the annotation when a thread is activated
  useEffect(() => {
    if (!activeThreadId || !editorContainerRef.current) return;
    const container = editorContainerRef.current;
    const thread = document.threads.find((t) => t.id === activeThreadId);
    if (!thread) return;
    const annotation = document.annotations.find((a) => a.id === thread.annotationId);
    if (!annotation) return;

    requestAnimationFrame(() => {
      const result = getTextRangeRects(
        annotation.anchor.blockId,
        annotation.anchor.start,
        annotation.anchor.end,
        container,
        annotation.anchor.quote
      );
      if (!result) return;

      const containerRect = container.getBoundingClientRect();
      const annotationTop = result.bounds.top - containerRect.top + container.scrollTop;
      const annotationBottom = annotationTop + result.bounds.height;

      const viewportTop = container.scrollTop;
      const viewportBottom = viewportTop + container.clientHeight;

      if (annotationTop < viewportTop + 40 || annotationBottom > viewportBottom - 40) {
        container.scrollTo({
          top: annotationTop - container.clientHeight / 3,
          behavior: "smooth",
        });
      }
    });
  }, [activeThreadId, document.threads, document.annotations]);

  if (!documentPath) {
    return <EmptyState />;
  }

  return (
    <div
      ref={editorContainerRef}
      data-editor-container
      className="relative h-full overflow-y-auto"
      style={{
        "--editor-font-family": fontFamilies[fontFamily].value,
        "--editor-font-size": `${fontSize}rem`,
        "--editor-line-height": String(lineHeight),
        "--editor-letter-spacing": `${letterSpacing}em`,
      } as React.CSSProperties}
    >
      <div className="flex">
        <div className="flex-1">
          <div className="mx-auto px-6 py-12" style={{ maxWidth: canvasMaxWidths[canvasWidth] }}>
            <div className="mb-8 flex items-center justify-between pl-[54px]">
              <DocumentTitle />
              <div className="flex items-center gap-1">
                <DisplaySettingsPopover />
                <ThreadPanelToggle />
              </div>
            </div>

            <WriterCanvas
              key={`writer-canvas-${editorSeed}`}
              documentBlocks={canonicalDocumentToBlockNote(document)}
              onBlocksChange={syncFromBlocks}
            />
          </div>
        </div>

        {showThreadPanel && (
          <div className="relative w-72 shrink-0">
            <ThreadPanel editorContainerRef={editorContainerRef} />
          </div>
        )}
      </div>

      <PendingCommentHighlight containerRef={editorContainerRef} />
      <AnnotationHighlightOverlay containerRef={editorContainerRef} />
      <AgentCursorOverlay />
    </div>
  );
}
