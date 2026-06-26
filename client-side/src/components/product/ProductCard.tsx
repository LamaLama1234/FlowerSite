import { Flower2 } from "lucide-react";

import type { IProduct } from "@/shared/types/product.interface";
import { formatPrice, resolveImageUrl } from "@/utils/product";

export function ProductCard({ product }: { product: IProduct }) {
  const image = resolveImageUrl(product.images?.[0]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md hover:shadow-emerald-900/5">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Flower2 className="size-10" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category?.title && (
          <span className="text-primary text-xs font-medium uppercase tracking-wide">
            {product.category.title}
          </span>
        )}
        <h3 className="line-clamp-1 font-semibold">{product.title}</h3>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {product.description}
        </p>
        <p className="mt-auto pt-2 text-lg font-semibold">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}
