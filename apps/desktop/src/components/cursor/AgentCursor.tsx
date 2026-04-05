import { cn } from "@/lib/utils";
import type { HTMLAttributes, SVGProps } from "react";

/* ── Cursor Root ── */
export type AgentCursorProps = HTMLAttributes<HTMLSpanElement> & {
  color?: string;
};

export function AgentCursor({
  className,
  children,
  color,
  style,
  ...props
}: AgentCursorProps) {
  return (
    <span
      className={cn("pointer-events-none absolute select-none", className)}
      style={{ ...style, "--agent-color": color ?? "#6366f1" } as React.CSSProperties}
      {...props}
    >
      {children}
    </span>
  );
}

/* ── Pointer SVG ── */
export type CursorPointerProps = SVGProps<SVGSVGElement>;

export function CursorPointer({ className, ...props }: CursorPointerProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-4", className)}
      fill="none"
      focusable="false"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M19.438 6.716 1.115.05A.832.832 0 0 0 .05 1.116L6.712 19.45a.834.834 0 0 0 1.557.025l3.198-8 7.995-3.2a.833.833 0 0 0 0-1.559h-.024Z"
        fill="var(--agent-color, currentColor)"
      />
    </svg>
  );
}

/* ── Body (name + message bubble) ── */
export type CursorBodyProps = HTMLAttributes<HTMLSpanElement>;

export function CursorBody({
  children,
  className,
  style,
  ...props
}: CursorBodyProps) {
  return (
    <span
      className={cn(
        "relative ml-3 flex flex-col whitespace-nowrap rounded-lg py-1 pr-3 pl-2.5 text-xs text-white shadow-md",
        className
      )}
      style={{
        backgroundColor: "var(--agent-color, #6366f1)",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

/* ── Name label ── */
export type CursorNameProps = HTMLAttributes<HTMLSpanElement>;

export function CursorName({ className, ...props }: CursorNameProps) {
  return <span className={cn("font-medium opacity-90", className)} {...props} />;
}

/* ── Message bubble ── */
export type CursorMessageProps = HTMLAttributes<HTMLSpanElement>;

export function CursorMessage({ className, ...props }: CursorMessageProps) {
  return <span className={cn("mt-0.5 opacity-100", className)} {...props} />;
}
