import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HardRulesEditorProps {
  rules: string[];
  onAdd: (rule: string) => void;
  onRemove: (index: number) => void;
}

export function HardRulesEditor({ rules, onAdd, onRemove }: HardRulesEditorProps) {
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="새 규칙 추가..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-8 text-sm"
        />
        <Button size="sm" variant="outline" onClick={handleAdd} className="h-8 px-2">
          <Plus size={14} />
        </Button>
      </div>
      {rules.map((rule, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
        >
          <span className="flex-1">{rule}</span>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="mt-0.5 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
