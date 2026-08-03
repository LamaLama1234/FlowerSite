import Link from "next/link";
import { Flower2 } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { SparkleField } from "@/components/decorative/SparkleField";

export const metadata: Metadata = {
  title: "Страница не найдена",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16">
      <div className="border-gold-200/60 relative flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
        <SparkleField count={4} />
        <Flower2 className="text-gold-400 relative size-10" />
        <div className="relative">
          <h1 className="font-heading text-2xl text-primary">
            Страница не найдена
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Такой страницы не существует или она была перемещена.
          </p>
        </div>
        <Button asChild className="relative">
          <Link href="/">На главную</Link>
        </Button>
      </div>
    </main>
  );
}
