import Image from "next/image";
import Link from "next/link";
import { Flower2, Heart, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import type { IProduct } from "@/shared/types/product.interface";
import { formatPrice, resolveImageUrl } from "@/utils/product";
import { useCartStore } from "@/stores/cart.store";
import { useFavoritesStore, useIsFavorite } from "@/stores/favorites.store";
import { CornerFlourish } from "@/components/decorative/CornerFlourish";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: IProduct }) {
  const image = resolveImageUrl(product.images?.[0]);
  const addItem = useCartStore((state) => state.addItem);
  const isFavorite = useIsFavorite(product.id);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const hasDiscount = Boolean(
    product.oldPrice && product.oldPrice > product.price,
  );
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / (product.oldPrice as number)) * 100)
    : null;

  function handleAddToCart() {
    addItem(product);
    toast.success(`«${product.title}» добавлен в корзину`);
  }

  function handleToggleFavorite(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(product);
    toast.success(
      isFavorite
        ? `«${product.title}» удалён из избранного`
        : `«${product.title}» добавлен в избранное`,
    );
  }

  return (
    <article className="border-gold-200/50 hover:border-gold-300/70 group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-[0_16px_28px_-10px_rgba(184,147,91,0.22)]">
      <CornerFlourish corner="tl" className="z-10" />
      {/* Лёгкий диагональный блик при наведении — не мешает содержимому. */}
      <div className="bg-celestial-shimmer pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:animate-celestial-shimmer" />

      {hasDiscount && (
        <span className="absolute top-3 left-3 z-20 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
          -{discountPercent}%
        </span>
      )}

      <button
        type="button"
        onClick={handleToggleFavorite}
        aria-label={
          isFavorite ? "Убрать из избранного" : "Добавить в избранное"
        }
        aria-pressed={isFavorite}
        className="text-muted-foreground hover:text-destructive absolute top-2 right-2 z-20 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors dark:bg-black/40"
      >
        <Heart
          className={cn("size-4", isFavorite && "fill-destructive text-destructive")}
        />
      </button>

      {/* display: contents — ссылка не ломает flex-раскладку article,
          кнопка "В корзину" ниже остаётся вне неё и не триггерит переход. */}
      <Link href={`/catalog/${product.id}`} className="contents">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              unoptimized
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Flower2 className="size-10" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4 pb-0">
          {product.category?.title && (
            <span className="text-primary text-xs font-medium uppercase tracking-wide">
              {product.category.title}
            </span>
          )}
          <h3 className="font-heading line-clamp-1 text-base text-primary">
            {product.title}
          </h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {product.description}
          </p>
          <div className="mt-auto pt-2">
            <p className="flex items-baseline gap-2">
              <span className="text-lg font-semibold">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-muted-foreground text-sm line-through">
                  {formatPrice(product.oldPrice as number)}
                </span>
              )}
            </p>
            <span className="via-gold-400 mt-1 block h-px w-10 bg-gradient-to-r from-transparent to-transparent" />
          </div>
        </div>
      </Link>

      <div className="p-4 pt-2">
        <Button size="sm" className="w-full" onClick={handleAddToCart}>
          <ShoppingCart className="size-4" />В корзину
        </Button>
      </div>
    </article>
  );
}
