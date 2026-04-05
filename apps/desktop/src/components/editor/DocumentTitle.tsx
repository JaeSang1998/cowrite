import { useDocumentStore } from "@/store/documentStore";

export function DocumentTitle() {
  const document = useDocumentStore((s) => s.document);
  const updateTitle = useDocumentStore((s) => s.updateTitle);

  return (
    <h1
      key={`title-${document.docId}`}
      className="font-display text-3xl font-normal text-foreground outline-none empty:before:text-muted-foreground/40 empty:before:content-['Untitled']"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => {
        const text = e.currentTarget.textContent?.trim() ?? "";
        updateTitle(text);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      dangerouslySetInnerHTML={{ __html: document.title }}
    />
  );
}
