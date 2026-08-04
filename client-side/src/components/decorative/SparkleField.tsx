import { Leaf } from "lucide-react";

import { cn } from "@/lib/utils";

interface SparkleFieldProps {
  count?: number;
  className?: string;
}

interface PetalSpec {
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
}

// Фиксированный, но визуально "случайный" набор позиций — детерминированный,
// чтобы не ловить hydration mismatch (Math.random() недопустим при рендере).
const PETALS: PetalSpec[] = [
  { top: "10%", left: "8%", size: 14, delay: "0s", duration: "4.4s" },
  { top: "22%", left: "88%", size: 11, delay: "0.8s", duration: "5s" },
  { top: "68%", left: "4%", size: 13, delay: "1.6s", duration: "4.2s" },
  { top: "82%", left: "78%", size: 16, delay: "0.4s", duration: "5.4s" },
  { top: "42%", left: "94%", size: 10, delay: "2.1s", duration: "4.7s" },
  { top: "6%", left: "48%", size: 12, delay: "1.2s", duration: "4.6s" },
];

/**
 * Несколько листочков, медленно дрейфующих поверх секции. Родитель должен
 * быть `relative overflow-hidden`. Чисто декоративно — aria-hidden.
 */
export function SparkleField({ count = 6, className = "" }: SparkleFieldProps) {
  const petals = PETALS.slice(0, count);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      {petals.map((petal, index) => (
        <Leaf
          key={index}
          className="text-gold-400 animate-celestial-twinkle absolute"
          style={{
            top: petal.top,
            left: petal.left,
            width: petal.size,
            height: petal.size,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        />
      ))}
    </div>
  );
}
