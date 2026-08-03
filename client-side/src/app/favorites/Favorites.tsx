"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  useFavoritesHasHydrated,
  useFavoritesStore,
} from "@/stores/favorites.store";
import { SparkleField } from "@/components/decorative/SparkleField";

export function Favorites() {
  const items = useFavoritesStore((state) => state.items);
  const hasHydrated = useFavoritesHasHydrated();

  // До завершения гидратации из localStorage items всегда "[]" — ждём,
  // как и в корзине (см. cart.store.ts), иначе на каждой жёсткой
  // перезагрузке мелькнёт пустое состояние.
  if (!hasHydrated) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-8 h-9 w-56 animate-pulse rounded bg-muted" />
        <ProductGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </ProductGrid>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <div className="border-gold-200/60 relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <SparkleField count={4} />
          <Heart className="text-gold-400 relative size-10" />
          <p className="text-muted-foreground relative">
            В избранном пока пусто
          </p>
          <Button asChild className="relative">
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="font-heading mb-8 text-3xl text-primary">Избранное</h1>
      <ProductGrid>
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductGrid>
    </main>
  );
}
