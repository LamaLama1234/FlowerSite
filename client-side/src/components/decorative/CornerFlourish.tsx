import { cn } from "@/lib/utils";

interface CornerFlourishProps {
  corner?: "tl" | "tr" | "bl" | "br";
  className?: string;
}

const POSITION_CLASS: Record<NonNullable<CornerFlourishProps["corner"]>, string> = {
  tl: "top-2 left-2",
  tr: "top-2 right-2 -scale-x-100",
  bl: "bottom-2 left-2 -scale-y-100",
  br: "bottom-2 right-2 -scale-x-100 -scale-y-100",
};

/**
 * Тонкая золотая угловая завитушка. Требует, чтобы родитель был
 * `relative overflow-hidden` — сам компонент только позиционируется.
 */
export function CornerFlourish({
  corner = "tl",
  className = "",
}: CornerFlourishProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn(
        "text-gold-400/60 pointer-events-none absolute size-8",
        POSITION_CLASS[corner],
        className,
      )}
      aria-hidden="true"
    >
      <path
        d="M6 22 V10 H18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M6 10 Q6 6 10 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M18 10 Q30 10 30 22 Q30 30 22 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="22" cy="30" r="1.5" fill="currentColor" />
    </svg>
  );
}
