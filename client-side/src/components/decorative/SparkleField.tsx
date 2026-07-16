import { Sparkle, Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface SparkleFieldProps {
  count?: number;
  className?: string;
}

interface SparkleSpec {
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  icon: "sparkle" | "star";
}

// Фиксированный, но визуально "случайный" набор позиций — детерминированный,
// чтобы не ловить hydration mismatch (Math.random() недопустим при рендере).
const SPARKLES: SparkleSpec[] = [
  { top: "10%", left: "8%", size: 14, delay: "0s", duration: "3.2s", icon: "sparkle" },
  { top: "22%", left: "88%", size: 10, delay: "0.6s", duration: "3.6s", icon: "star" },
  { top: "68%", left: "4%", size: 12, delay: "1.1s", duration: "3.1s", icon: "star" },
  { top: "82%", left: "78%", size: 16, delay: "0.3s", duration: "3.8s", icon: "sparkle" },
  { top: "42%", left: "94%", size: 9, delay: "1.5s", duration: "3.4s", icon: "sparkle" },
  { top: "6%", left: "48%", size: 11, delay: "0.9s", duration: "3.3s", icon: "star" },
];

/**
 * Несколько мерцающих искр/звёзд поверх секции. Родитель должен быть
 * `relative overflow-hidden`. Чисто декоративно — aria-hidden.
 */
export function SparkleField({ count = 6, className = "" }: SparkleFieldProps) {
  const sparkles = SPARKLES.slice(0, count);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      {sparkles.map((sparkle, index) => {
        const Icon = sparkle.icon === "star" ? Star : Sparkle;
        return (
          <Icon
            key={index}
            className="text-gold-400 animate-celestial-twinkle absolute"
            style={{
              top: sparkle.top,
              left: sparkle.left,
              width: sparkle.size,
              height: sparkle.size,
              animationDelay: sparkle.delay,
              animationDuration: sparkle.duration,
            }}
          />
        );
      })}
    </div>
  );
}
