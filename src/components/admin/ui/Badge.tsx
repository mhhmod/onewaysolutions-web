import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "primary" | "success" | "warning" | "danger" | "muted";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-steel/12 text-primary",
  accent: "bg-accent/12 text-accent",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/18 text-primary",
  danger: "bg-danger/12 text-danger",
  muted: "bg-muted text-steel"
};

export function Badge({
  tone = "neutral",
  children,
  className
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
