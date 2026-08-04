"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { cn } from "@/lib/utils";

interface CarouselProps {
  slides: React.ReactNode[];
  className?: string;
  aspectClassName?: string;
  autoplay?: boolean;
  autoplayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  /** Управляемый индекс — например, синхронизация с рядом миниатюр снаружи. */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

const SWIPE_THRESHOLD = 60;

export function Carousel({
  slides,
  className,
  aspectClassName = "aspect-square",
  autoplay = false,
  autoplayInterval = 5000,
  showArrows = true,
  showDots = true,
  activeIndex,
  onActiveIndexChange,
}: CarouselProps) {
  const count = slides.length;
  const [internalIndex, setInternalIndex] = useState(0);
  const index = activeIndex ?? internalIndex;

  const [direction, setDirection] = useState(0);
  const prevIndexRef = useRef(index);

  useEffect(() => {
    if (prevIndexRef.current !== index) {
      setDirection(index > prevIndexRef.current ? 1 : -1);
      prevIndexRef.current = index;
    }
  }, [index]);

  const setIndex = useCallback(
    (next: number) => {
      if (count <= 1) return;
      const wrapped = ((next % count) + count) % count;
      if (onActiveIndexChange) onActiveIndexChange(wrapped);
      else setInternalIndex(wrapped);
    },
    [count, onActiveIndexChange],
  );

  const next = useCallback(() => setIndex(index + 1), [index, setIndex]);
  const prev = useCallback(() => setIndex(index - 1), [index, setIndex]);

  useEffect(() => {
    if (!autoplay || count <= 1) return;
    const id = setInterval(() => setIndex(index + 1), autoplayInterval);
    return () => clearInterval(id);
  }, [autoplay, autoplayInterval, count, index, setIndex]);

  if (count === 0) return null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        aspectClassName,
        className,
      )}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <m.div
          key={index}
          custom={direction}
          initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          drag={count > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (info.offset.x < -SWIPE_THRESHOLD) next();
            else if (info.offset.x > SWIPE_THRESHOLD) prev();
          }}
          className="absolute inset-0"
        >
          {slides[index]}
        </m.div>
      </AnimatePresence>

      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Предыдущее изображение"
            className="bg-background/80 text-foreground hover:bg-background absolute top-1/2 left-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Следующее изображение"
            className="bg-background/80 text-foreground hover:bg-background absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Слайд ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "size-1.5 rounded-full transition-colors duration-150",
                i === index ? "bg-primary" : "bg-primary/30 hover:bg-primary/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
