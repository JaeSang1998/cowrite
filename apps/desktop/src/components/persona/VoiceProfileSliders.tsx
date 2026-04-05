import { Slider } from "@/components/ui/slider";
import type { PersonaVoiceProfile } from "@cowrite/writer-core";

const voiceKeys: { key: keyof PersonaVoiceProfile; label: string }[] = [
  { key: "brevity", label: "간결함" },
  { key: "directness", label: "직접성" },
  { key: "warmth", label: "따뜻함" },
  { key: "softness", label: "부드러움" },
];

interface VoiceProfileSlidersProps {
  voice: PersonaVoiceProfile;
  onChange: (voice: PersonaVoiceProfile) => void;
  readOnly?: boolean;
}

export function VoiceProfileSliders({ voice, onChange, readOnly }: VoiceProfileSlidersProps) {
  return (
    <div className="space-y-4">
      {voiceKeys.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm tabular-nums text-foreground">{voice[key]}</span>
          </div>
          <Slider
            value={[voice[key]]}
            min={0}
            max={100}
            step={1}
            disabled={readOnly}
            onValueChange={([value]) =>
              onChange({ ...voice, [key]: value })
            }
          />
        </div>
      ))}
    </div>
  );
}
