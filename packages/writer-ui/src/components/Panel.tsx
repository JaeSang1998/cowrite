import { clsx } from "clsx";
import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";

interface PanelProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Panel({
  title,
  subtitle,
  actions,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section
      className={clsx(
        "rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-md",
        className
      )}
      {...props}
    >
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-paper">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-paper/55">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

interface TagPillProps {
  children: ReactNode;
  tone?: "default" | "accent" | "muted";
}

export function TagPill({ children, tone = "default" }: TagPillProps) {
  const toneClasses =
    tone === "accent"
      ? "bg-amber-300/15 text-amber-100"
      : tone === "muted"
        ? "bg-white/8 text-paper/60"
        : "bg-teal-300/15 text-teal-100";

  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium tracking-[0.08em]",
        toneClasses
      )}
    >
      {children}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#121825] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-paper/45">{label}</p>
      <p className="mt-2 font-display text-2xl text-paper">{value}</p>
      {hint ? <p className="mt-1 text-sm text-paper/55">{hint}</p> : null}
    </div>
  );
}

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  body?: string;
}

export function SectionTitle({ eyebrow, title, body }: SectionTitleProps) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.16em] text-paper/45">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 font-display text-3xl leading-tight text-paper">{title}</h1>
      {body ? <p className="mt-3 max-w-2xl text-paper/68">{body}</p> : null}
    </div>
  );
}

