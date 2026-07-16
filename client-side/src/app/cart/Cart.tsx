"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useCartHasHydrated,
  useCartStore,
  useCartTotal,
} from "@/stores/cart.store";
import type { ICartItem } from "@/shared/types/cart.interface";
import { formatPrice, resolveImageUrl } from "@/utils/product";
import { CornerFlourish } from "@/components/decorative/CornerFlourish";
import { SparkleField } from "@/components/decorative/SparkleField";

export function Cart() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = useCartTotal();
  const hasHydrated = useCartHasHydrated();

  // До завершения гидратации из localStorage items всегда "[]" — ждём,
  // иначе на каждой жёсткой перезагрузке мелькнёт пустое состояние.
  if (!hasHydrated) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-8 h-9 w-40 animate-pulse rounded bg-muted" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <div className="border-gold-200/60 relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <SparkleField count={4} />
          <ShoppingBag className="text-gold-400 relative size-10" />
          <p className="text-muted-foreground relative">Ваша корзина пуста</p>
          <Button asChild className="relative">
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-heading mb-8 text-3xl text-primary">Корзина</h1>

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <CartRow
            key={item.id}
            item={item}
            onQuantityChange={(quantity) => setQuantity(item.id, quantity)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </ul>

      <div className="glass-panel relative mt-8 flex flex-col gap-4 rounded-2xl p-6">
        <CornerFlourish corner="tr" />
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Итого</span>
          <span>{formatPrice(total)}</span>
        </div>
        <Button asChild size="lg">
          <Link href="/checkout">Оформить заказ</Link>
        </Button>
      </div>
    </main>
  );
}

function CartRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: ICartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const image = resolveImageUrl(item.product.images?.[0]);

  return (
    <li className="border-gold-200/40 flex items-center gap-4 rounded-2xl border bg-card p-3 transition-colors hover:border-gold-300/60">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        {image && (
          <Image
            src={image}
            alt={item.product.title}
            fill
            unoptimized
            sizes="80px"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <h3 className="line-clamp-1 font-medium">{item.product.title}</h3>
        <p className="text-muted-foreground text-sm">
          {formatPrice(item.price)}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="icon"
          variant="outline"
          className="size-7"
          onClick={() => onQuantityChange(item.quantity - 1)}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="w-6 text-center text-sm font-medium">
          {item.quantity}
        </span>
        <Button
          size="icon"
          variant="outline"
          className="size-7"
          onClick={() => onQuantityChange(item.quantity + 1)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <p className="w-24 text-right font-semibold">
        {formatPrice(item.price * item.quantity)}
      </p>

      <Button
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
