"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Flower2, Heart, Minus, Plus, ShoppingCart, Tag } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useProduct } from "@/hooks/useProduct";
import { useRelatedProducts } from "@/hooks/useRelatedProducts";
import { useCartStore } from "@/stores/cart.store";
import { useFavoritesStore, useIsFavorite } from "@/stores/favorites.store";
import { formatPrice, resolveImageUrl } from "@/utils/product";
import { CornerFlourish } from "@/components/decorative/CornerFlourish";
import { GoldDivider } from "@/components/decorative/GoldDivider";
import { cn } from "@/lib/utils";

export function ProductDetail({ id }: { id: string }) {
  const { data: product, isLoading, isError } = useProduct(id);
  const { data: relatedProducts } = useRelatedProducts(id);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const isFavorite = useIsFavorite(id);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  const backLink = (
    <Link
      href="/catalog"
      className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
    >
      <ArrowLeft className="size-4" />
      Назад в каталог
    </Link>
  );

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {backLink}
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
          <div className="flex flex-col gap-3">
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-20 animate-pulse rounded bg-muted" />
            <div className="h-8 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        {backLink}
        <div className="border-gold-200/60 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground">Товар не найден</p>
          <Button asChild>
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      </main>
    );
  }

  const images = product.images?.length ? product.images : [];
  const mainImage = resolveImageUrl(images[activeImage]);
  const hasDiscount = Boolean(
    product.oldPrice && product.oldPrice > product.price,
  );

  function handleAddToCart() {
    addItem(product!, quantity);
    toast.success(`«${product!.title}» добавлен в корзину`);
  }

  function handleToggleFavorite() {
    toggleFavorite(product!);
    toast.success(
      isFavorite
        ? `«${product!.title}» удалён из избранного`
        : `«${product!.title}» добавлен в избранное`,
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      {backLink}

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="glass-panel relative aspect-square overflow-hidden rounded-2xl p-2">
            <CornerFlourish corner="tl" className="z-10" />
            <CornerFlourish corner="br" className="z-10" />
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.title}
                fill
                unoptimized
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Flower2 className="size-16" />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((src, index) => {
                const thumb = resolveImageUrl(src);
                if (!thumb) return null;

                return (
                  <button
                    key={src + index}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`relative size-16 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                      index === activeImage
                        ? "border-primary"
                        : "border-border"
                    }`}
                  >
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      unoptimized
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              {product.category?.title && (
                <span className="text-primary text-xs font-medium uppercase tracking-wide">
                  {product.category.title}
                </span>
              )}
              <h1 className="font-heading text-3xl text-primary">
                {product.title}
              </h1>
            </div>

            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={
                isFavorite ? "Убрать из избранного" : "Добавить в избранное"
              }
              aria-pressed={isFavorite}
              className="border-border hover:text-destructive text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors"
            >
              <Heart
                className={cn(
                  "size-5",
                  isFavorite && "fill-destructive text-destructive",
                )}
              />
            </button>
          </div>
          <p className="text-muted-foreground mt-3 whitespace-pre-line">
            {product.description}
          </p>

          {product.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="border-gold-200/60 bg-gold-50 text-gold-700 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
                >
                  <Tag className="size-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="mt-6 flex items-baseline gap-2 text-2xl font-semibold">
            {formatPrice(product.price)}
            {hasDiscount && (
              <span className="text-muted-foreground text-base font-normal line-through">
                {formatPrice(product.oldPrice as number)}
              </span>
            )}
          </p>

          <GoldDivider variant="sparkle" className="my-1 max-w-xs" />

          <div className="mt-1 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>

            <Button size="lg" className="flex-1" onClick={handleAddToCart}>
              <ShoppingCart className="size-4" />В корзину
            </Button>
          </div>
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-16">
          <GoldDivider variant="sparkle" className="mb-8" />
          <h2 className="font-heading mb-6 text-2xl text-primary">
            Похожие товары
          </h2>
          <ProductGrid>
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </ProductGrid>
        </section>
      )}
    </main>
  );
}
