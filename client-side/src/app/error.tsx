"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SparkleField } from "@/components/decorative/SparkleField";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16">
      <div className="border-gold-200/60 relative flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
        <SparkleField count={4} />
        <TriangleAlert className="text-gold-400 relative size-10" />
        <div className="relative">
          <h1 className="font-heading text-2xl text-primary">
            Что-то пошло не так
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </p>
        </div>
        <Button className="relative" onClick={reset}>
          Попробовать снова
        </Button>
      </div>
    </main>
  );
}
