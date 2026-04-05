import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Copy, Plus, Sparkles, Trash2 } from "lucide-react";
import type { StyleExample } from "@cowrite/writer-core";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface StyleExamplesEditorProps {
  examples: StyleExample[];
  onAdd: (example: Omit<StyleExample, "id" | "createdAt">) => void;
  onRemove: (index: number) => void;
  onAnalyze?: () => void;
  analyzePrompt?: string | null;
}

export function StyleExamplesEditor({
  examples,
  onAdd,
  onRemove,
  onAnalyze,
  analyzePrompt,
}: StyleExamplesEditorProps) {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canAdd = before.trim().length > 0 && after.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({
      before: before.trim(),
      after: after.trim(),
      note: note.trim() || undefined,
    });
    setBefore("");
    setAfter("");
    setNote("");
    setShowForm(false);
  };

  const handleCopyPrompt = async () => {
    if (!analyzePrompt) return;
    await navigator.clipboard.writeText(analyzePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Existing examples */}
      {examples.map((ex, i) => {
        const isExpanded = expandedIds.has(ex.id);
        return (
          <div
            key={ex.id}
            className="group rounded-md border border-border bg-muted/30 text-sm"
          >
            {/* Collapsed header - always visible */}
            <button
              type="button"
              onClick={() => toggleExpanded(ex.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
              )}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {ex.note && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ex.note}
                  </span>
                )}
                {!isExpanded && (
                  <span className="truncate text-xs text-muted-foreground">
                    {ex.before.slice(0, 40)}{ex.before.length > 40 ? "…" : ""}
                    {" → "}
                    {ex.after.slice(0, 40)}{ex.after.length > 40 ? "…" : ""}
                  </span>
                )}
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="ml-auto shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="space-y-1 px-3 pb-2.5 pl-9">
                <div className="flex items-start gap-1.5">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">
                    Before
                  </Badge>
                  <span className="whitespace-pre-wrap text-muted-foreground">{ex.before}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Badge variant="secondary" className="mt-0.5 shrink-0 text-[10px]">
                    After
                  </Badge>
                  <span className="whitespace-pre-wrap">{ex.after}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add form */}
      {showForm ? (
        <div className="space-y-2 rounded-md border border-dashed border-foreground/20 p-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Before (원본)
            </label>
            <Textarea
              placeholder="원래 받은 문장이나 표현..."
              value={before}
              onChange={(e) => setBefore(e.target.value)}
              rows={2}
              className="text-sm"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight size={14} className="text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              After (내 말투로 바꾼 것)
            </label>
            <Textarea
              placeholder="내 스타일로 고친 문장..."
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              메모 (선택)
            </label>
            <Input
              placeholder="예: 존댓말→반말 변환"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-7 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => {
                setShowForm(false);
                setBefore("");
                setAfter("");
                setNote("");
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              추가
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus size={12} />
            예시 추가
          </Button>
          {examples.length > 0 && onAnalyze && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 gap-1 text-xs"
              onClick={onAnalyze}
            >
              <Sparkles size={12} />
              분석하기
            </Button>
          )}
        </div>
      )}

      {/* Analyze prompt copy area */}
      {analyzePrompt && (
        <div className="space-y-2 rounded-md border border-foreground/10 bg-accent/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              분석 프롬프트가 생성되었습니다
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 text-xs"
              onClick={handleCopyPrompt}
            >
              <Copy size={12} />
              {copied ? "복사됨!" : "복사"}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            아래 프롬프트를 AI 에이전트에 붙여넣으면, Before/After 예시를
            분석해서 페르소나 설정을 자동으로 업데이트합니다.
          </p>
          <pre className="max-h-[120px] overflow-auto whitespace-pre-wrap rounded bg-background p-2 text-[11px] text-muted-foreground">
            {analyzePrompt}
          </pre>
        </div>
      )}
    </div>
  );
}
