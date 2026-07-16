import Image from "next/image";
import Link from "next/link";
import { Flower2, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import type { IProduct } from "@/shared/types/product.interface";
import { formatPrice, resolveImageUrl } from "@/utils/product";
import { useCartStore } from "@/stores/cart.store";
import { CornerFlourish } from "@/components/decorative/CornerFlourish";

export function ProductCard({ product }: { product: IProduct }) {
  const image = resolveImageUrl(product.images?.[0]);
  const addItem = useCartStore((state) => state.addItem);

  function handleAddToCart() {
    addItem(product);
    toast.success(`«${product.title}» добавлен в корзину`);
  }

  return (
    <article className="border-gold-200/50 hover:border-gold-300/70 group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-[0_16px_28px_-10px_rgba(184,147,91,0.22)]">
      <CornerFlourish corner="tl" className="z-10" />
      {/* Лёгкий диагональный блик при наведении — не мешает содержимому. */}
      <div className="bg-celestial-shimmer pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:animate-celestial-shimmer" />

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
            <p className="text-lg font-semibold">
              {formatPrice(product.price)}
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
