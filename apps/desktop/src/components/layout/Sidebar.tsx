import { useEffect, useState } from "react";
import { FileText, Settings, RefreshCw, Plus, Search, Trash2, PanelLeftClose } from "lucide-react";
import { useViewStore, type View } from "@/store/viewStore";
import { useDocumentStore } from "@/store/documentStore";
import {
  loadDocumentFromPath,
  scanDocuments,
  createNewDocument,
  deleteDocument
} from "@/lib/documents";
import { cn } from "@/lib/utils";

const navItems: { view: View; icon: typeof FileText; label: string }[] = [
  { view: "editor", icon: FileText, label: "에디터" },
  { view: "persona", icon: Settings, label: "페르소나" },
];

export function Sidebar() {
  const { currentView, setView, toggleSidebar } = useViewStore();
  const { document, documentList, documentPath, setDocumentList, loadDocument } =
    useDocumentStore();
  const [query, setQuery] = useState("");

  const refreshDocuments = async () => {
    const docs = await scanDocuments();
    setDocumentList(docs);
  };

  const handleCreateDocument = async () => {
    const result = await createNewDocument();
    if (result) {
      loadDocument(result.document, result.path);
      await refreshDocuments();
      setView("editor");
    }
  };

  const handleDeleteDocument = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await deleteDocument(path);
    if (!ok) return;

    // If we deleted the currently open document, clear it
    if (documentPath === path) {
      const { createDraftDocument } = await import("@cowrite/writer-core");
      loadDocument(createDraftDocument(), undefined);
    }

    await refreshDocuments();
  };

  useEffect(() => {
    refreshDocuments();
  }, []);

  const handleSelectDocument = async (path: string) => {
    const entry = await loadDocumentFromPath(path);
    if (entry) {
      loadDocument(entry.document, entry.path);
      setView("editor");
    }
  };

  const filtered = query.trim()
    ? documentList.filter((item) =>
        (item.title || "").toLowerCase().includes(query.toLowerCase())
      )
    : documentList;

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <div className="flex items-center gap-1">
          {navItems.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              type="button"
              onClick={() => setView(view)}
              title={label}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors",
                currentView === view
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          title="사이드바 닫기"
          className="flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 pt-2">
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
          <Search size={13} className="shrink-0 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="문서 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          문서 {filtered.length !== documentList.length && `(${filtered.length}/${documentList.length})`}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCreateDocument}
            title="새 문서"
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus size={12} />
          </button>
          <button
            type="button"
            onClick={refreshDocuments}
            title="새로고침"
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            {query.trim() ? "검색 결과가 없습니다" : "문서가 없습니다"}
          </p>
        )}
        {filtered.map((item) => (
          <div
            key={item.path}
            className={cn(
              "group mb-0.5 flex items-center rounded-md transition-colors",
              document.docId === item.docId
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <button
              type="button"
              onClick={() => handleSelectDocument(item.path)}
              className="min-w-0 flex-1 px-2.5 py-1.5 text-left text-sm"
            >
              <span className="line-clamp-1">{item.title || "제목 없음"}</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleDeleteDocument(item.path, e)}
              title="문서 삭제"
              className="mr-1 shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
}
