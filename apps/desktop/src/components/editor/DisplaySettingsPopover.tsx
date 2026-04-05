import { useState, useRef, useEffect } from "react";
import { Settings2, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  useDisplayStore,
  fontFamilies,
  type CanvasWidth,
  type FontFamily
} from "@/store/displayStore";
import { cn } from "@/lib/utils";

const widthOptions: { value: CanvasWidth; label: string }[] = [
  { value: "narrow", label: "좁게" },
  { value: "medium", label: "보통" },
  { value: "full", label: "넓게" }
];

const fontOptions: { value: FontFamily; label: string; preview: string }[] = [
  { value: "serif", label: "명조", preview: "가나다 Abc" },
  { value: "sans", label: "고딕", preview: "가나다 Abc" },
  { value: "mono", label: "모노", preview: "가나다 Abc" }
];

function SettingRow({
  label,
  value,
  children
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground/60">
          {value}
        </span>
      </div>
      {children}
    </div>
  );
}

export function DisplaySettingsPopover() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    fontSize,
    lineHeight,
    letterSpacing,
    canvasWidth,
    fontFamily,
    setFontSize,
    setLineHeight,
    setLetterSpacing,
    setCanvasWidth,
    setFontFamily,
    reset
  } = useDisplayStore();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-center rounded-md p-1.5 text-sm transition-colors",
          open
            ? "bg-foreground/10 text-foreground"
            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        )}
      >
        <Settings2 size={15} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-popover p-4 shadow-lg"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground">
              표시 설정
            </span>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw size={10} />
              초기화
            </button>
          </div>

          <div className="space-y-5">
            {/* Font family */}
            <div className="space-y-2">
              <span className="text-[12px] font-medium text-muted-foreground">
                글꼴
              </span>
              <div className="flex gap-1.5">
                {fontOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFontFamily(opt.value)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2.5 transition-colors",
                      fontFamily === opt.value
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className="text-[13px] leading-none"
                      style={{ fontFamily: fontFamilies[opt.value].value }}
                    >
                      {opt.preview}
                    </span>
                    <span className="text-[10px] opacity-60">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <SettingRow
              label="글자 크기"
              value={`${Math.round(fontSize * 16)}px`}
            >
              <Slider
                min={0.75}
                max={1.5}
                step={0.0625}
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
              />
            </SettingRow>

            {/* Line height */}
            <SettingRow label="행간" value={lineHeight.toFixed(2)}>
              <Slider
                min={1.2}
                max={2.5}
                step={0.05}
                value={[lineHeight]}
                onValueChange={([v]) => setLineHeight(v)}
              />
            </SettingRow>

            {/* Letter spacing */}
            <SettingRow
              label="자간"
              value={`${letterSpacing >= 0 ? "+" : ""}${letterSpacing.toFixed(2)}em`}
            >
              <Slider
                min={-0.05}
                max={0.15}
                step={0.005}
                value={[letterSpacing]}
                onValueChange={([v]) => setLetterSpacing(v)}
              />
            </SettingRow>

            {/* Canvas width */}
            <div className="space-y-2">
              <span className="text-[12px] font-medium text-muted-foreground">
                편집 폭
              </span>
              <div className="flex gap-1.5">
                {widthOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCanvasWidth(opt.value)}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
                      canvasWidth === opt.value
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
