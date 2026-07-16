import { Flower2, Sparkle } from "lucide-react";

import { cn } from "@/lib/utils";

interface GoldDividerProps {
  variant?: "diamond" | "flower" | "sparkle";
  className?: string;
}

/** Декоративный разделитель секций: золотая градиентная линия + акцент по центру. */
export function GoldDivider({
  variant = "diamond",
  className = "",
}: GoldDividerProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-3", className)}
      aria-hidden="true"
    >
      <span className="via-gold-300 h-px w-full max-w-32 bg-gradient-to-r from-transparent to-transparent" />
      <Ornament variant={variant} />
      <span className="via-gold-300 h-px w-full max-w-32 bg-gradient-to-l from-transparent to-transparent" />
    </div>
  );
}

function Ornament({ variant }: { variant: NonNullable<GoldDividerProps["variant"]> }) {
  if (variant === "flower") {
    return <Flower2 className="text-gold-500 size-4 shrink-0" />;
  }
  if (variant === "sparkle") {
    return <Sparkle className="text-gold-500 size-4 shrink-0" />;
  }
  return (
    <span className="border-gold-400 size-2 shrink-0 rotate-45 border" />
  );
}
