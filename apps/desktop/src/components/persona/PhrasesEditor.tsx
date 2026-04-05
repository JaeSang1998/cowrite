import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PhrasesEditorProps {
  phrases: string[];
  onAdd: (phrase: string) => void;
  onRemove: (index: number) => void;
  variant?: "default" | "destructive";
}

export function PhrasesEditor({ phrases, onAdd, onRemove, variant = "default" }: PhrasesEditorProps) {
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
          placeholder="표현 추가..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-8 text-sm"
        />
        <Button size="sm" variant="outline" onClick={handleAdd} className="h-8 px-2">
          <Plus size={14} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {phrases.map((phrase, i) => (
          <Badge key={i} variant={variant === "destructive" ? "destructive" : "secondary"} className="gap-1 pr-1">
            {phrase}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="ml-0.5 hover:opacity-70"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
