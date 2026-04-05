import { useState } from "react";
import { X } from "lucide-react";
import { createId, nowIso, type Persona, type PersonaVoiceProfile, type StyleExample } from "@cowrite/writer-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { VoiceProfileSliders } from "./VoiceProfileSliders";
import { HardRulesEditor } from "./HardRulesEditor";
import { PhrasesEditor } from "./PhrasesEditor";
import { StyleExamplesEditor } from "./StyleExamplesEditor";

interface CreatePersonaFormProps {
  onCreate: (overrides: Partial<Persona>) => void;
  onCancel: () => void;
}

const defaultVoice: PersonaVoiceProfile = {
  brevity: 50,
  warmth: 50,
  directness: 50,
  softness: 50,
};

export function CreatePersonaForm({ onCreate, onCancel }: CreatePersonaFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voice, setVoice] = useState<PersonaVoiceProfile>(defaultVoice);
  const [hardRules, setHardRules] = useState<string[]>([]);
  const [likedPhrases, setLikedPhrases] = useState<string[]>([]);
  const [dislikedPhrases, setDislikedPhrases] = useState<string[]>([]);
  const [styleExamples, setStyleExamples] = useState<StyleExample[]>([]);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      voice,
      hardRules,
      likedPhrases,
      dislikedPhrases,
      styleExamples,
    });
  };

  return (
    <Card className="border-dashed border-foreground/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">새 페르소나 만들기</CardTitle>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">
            이름 <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="예: 날카로운 편집자"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">설명</label>
          <Textarea
            placeholder="이 페르소나가 어떤 어조와 스타일을 가지는지 간략히 설명합니다."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">보이스 프로필</label>
          <VoiceProfileSliders voice={voice} onChange={setVoice} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">하드 규칙</label>
          <HardRulesEditor
            rules={hardRules}
            onAdd={(rule) => setHardRules((prev) => [...prev, rule])}
            onRemove={(idx) => setHardRules((prev) => prev.filter((_, i) => i !== idx))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">선호 표현</label>
          <PhrasesEditor
            phrases={likedPhrases}
            onAdd={(phrase) => setLikedPhrases((prev) => [...prev, phrase])}
            onRemove={(idx) => setLikedPhrases((prev) => prev.filter((_, i) => i !== idx))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">비선호 표현</label>
          <PhrasesEditor
            phrases={dislikedPhrases}
            variant="destructive"
            onAdd={(phrase) => setDislikedPhrases((prev) => [...prev, phrase])}
            onRemove={(idx) => setDislikedPhrases((prev) => prev.filter((_, i) => i !== idx))}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">말투 Before / After</label>
          <p className="text-xs text-muted-foreground">
            원본과 내 말투로 고친 문장을 쌓아두면, 생성 후 분석 기능으로 페르소나
            설정을 자동 보강할 수 있습니다.
          </p>
          <StyleExamplesEditor
            examples={styleExamples}
            onAdd={(ex) => {
              const example: StyleExample = {
                ...ex,
                id: createId("stex"),
                createdAt: nowIso(),
              };
              setStyleExamples((prev) => [...prev, example]);
            }}
            onRemove={(idx) =>
              setStyleExamples((prev) => prev.filter((_, i) => i !== idx))
            }
          />
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button size="sm" disabled={!canSubmit} onClick={handleSubmit}>
            만들기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
