import { type Ref, useState } from "react";
import { Check, GripVertical, Trash2 } from "lucide-react";
import { createId, nowIso, type Persona, type PersonaVoiceProfile, type StyleExample } from "@cowrite/writer-core";
import { buildAnalyzeStylePrompt } from "@cowrite/writer-ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { VoiceProfileSliders } from "./VoiceProfileSliders";
import { HardRulesEditor } from "./HardRulesEditor";
import { PhrasesEditor } from "./PhrasesEditor";
import { StyleExamplesEditor } from "./StyleExamplesEditor";

interface PersonaCardProps {
  persona: Persona;
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (updates: Partial<Persona>) => void;
  onDelete: () => void;
  dragHandleRef?: Ref<HTMLButtonElement>;
  dragHandleProps?: Record<string, unknown>;
}

export function PersonaCard({ persona, isActive, onActivate, onUpdate, onDelete, dragHandleRef, dragHandleProps }: PersonaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [analyzePrompt, setAnalyzePrompt] = useState<string | null>(null);

  return (
    <Card
      className={cn(
        "transition-colors",
        isActive && "border-foreground/20 bg-accent/50"
      )}
    >
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-start justify-between gap-3">
          {dragHandleRef && (
            <button
              ref={dragHandleRef}
              type="button"
              className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              {...dragHandleProps}
            >
              <GripVertical size={16} />
            </button>
          )}
          <div className="flex-1">
            <CardTitle className="text-base font-medium">{persona.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{persona.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="default" className="gap-1">
                <Check size={12} /> 활성
              </Badge>
            )}
            {!isActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate();
                }}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                활성화
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="secondary">간결 {persona.voice.brevity}</Badge>
          <Badge variant="secondary">직접 {persona.voice.directness}</Badge>
          <Badge variant="secondary">따뜻 {persona.voice.warmth}</Badge>
          <Badge variant="secondary">부드러움 {persona.voice.softness}</Badge>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5">
          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">이름</label>
            <Input
              value={persona.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">설명</label>
            <Textarea
              value={persona.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">보이스 프로필</label>
            <VoiceProfileSliders
              voice={persona.voice}
              onChange={(voice: PersonaVoiceProfile) => onUpdate({ voice })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">하드 규칙</label>
            <HardRulesEditor
              rules={persona.hardRules}
              onAdd={(rule) =>
                onUpdate({ hardRules: [...persona.hardRules, rule] })
              }
              onRemove={(idx) =>
                onUpdate({
                  hardRules: persona.hardRules.filter((_, i) => i !== idx),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">선호 표현</label>
            <PhrasesEditor
              phrases={persona.likedPhrases}
              onAdd={(phrase) =>
                onUpdate({ likedPhrases: [...persona.likedPhrases, phrase] })
              }
              onRemove={(idx) =>
                onUpdate({
                  likedPhrases: persona.likedPhrases.filter((_, i) => i !== idx),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">비선호 표현</label>
            <PhrasesEditor
              phrases={persona.dislikedPhrases}
              variant="destructive"
              onAdd={(phrase) =>
                onUpdate({ dislikedPhrases: [...persona.dislikedPhrases, phrase] })
              }
              onRemove={(idx) =>
                onUpdate({
                  dislikedPhrases: persona.dislikedPhrases.filter((_, i) => i !== idx),
                })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">말투 Before / After</label>
            <p className="text-xs text-muted-foreground">
              원본과 내 말투로 고친 문장을 쌓아두면, 분석을 통해 페르소나 설정을
              자동으로 보강할 수 있습니다.
            </p>
            <StyleExamplesEditor
              examples={persona.styleExamples ?? []}
              onAdd={(ex) => {
                const example: StyleExample = {
                  ...ex,
                  id: createId("stex"),
                  createdAt: nowIso(),
                };
                onUpdate({
                  styleExamples: [...(persona.styleExamples ?? []), example],
                });
              }}
              onRemove={(idx) =>
                onUpdate({
                  styleExamples: (persona.styleExamples ?? []).filter(
                    (_, i) => i !== idx
                  ),
                })
              }
              onAnalyze={() => {
                const prompt = buildAnalyzeStylePrompt(persona);
                setAnalyzePrompt(prompt);
              }}
              analyzePrompt={analyzePrompt}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
