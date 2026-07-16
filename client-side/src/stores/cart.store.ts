import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ICartItem } from "@/shared/types/cart.interface";
import type { IProduct } from "@/shared/types/product.interface";

interface CartState {
  items: ICartItem[];
  addItem: (product: IProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((item) => item.id === product.id);

        if (existing) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    price: product.price,
                  }
                : item,
            ),
          });
          return;
        }

        set({
          items: [
            ...items,
            { id: product.id, product, quantity, price: product.price },
          ],
        });
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },

      setQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.id !== productId) });
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          ),
        });
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: "greenart-cart",
      // createJSONStorage дёргает переданный геттер сразу же при создании
      // стора, чтобы проверить хранилище. На сервере (SSR) localStorage не
      // существует, вызов кидает исключение, zustand его глотает и в этом
      // случае вообще не создаёт api.persist — из-за чего
      // useCartStore.persist оказывается undefined на сервере. Подставляем
      // no-op хранилище для SSR, чтобы api.persist существовал всегда;
      // реально оно всё равно не используется до rehydrate() в Providers.
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : localStorage,
      ),
      // Гидратируем вручную (см. Providers) — иначе первый клиентский рендер
      // читает localStorage раньше SSR-эквивалента и ловит hydration mismatch,
      // как это уже было с accessToken-cookie на /dashboard.
      skipHydration: true,
    },
  ),
);

export const useCartCount = () =>
  useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );

export const useCartTotal = () =>
  useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

/**
 * true только после того, как persist реально прочитал localStorage
 * (см. rehydrate() в Providers). Пока false, items ещё может быть пустым
 * массивом "по умолчанию", а не реальным состоянием корзины — экраны,
 * которые принимают решения по пустой корзине (редирект в /cart на
 * чекауте, пустое состояние в самой корзине), должны дождаться этого
 * флага, иначе словят ложное "корзина пуста" на каждой жёсткой перезагрузке.
 */
export function useCartHasHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useCartStore.persist.hasHydrated(),
  );

  useEffect(() => {
    // Ленивый useState выше уже покрывает случай "гидратация успела
    // завершиться к моменту рендера" — здесь только подписка на будущее
    // завершение (Providers вызывает rehydrate() в своём эффекте, который
    // маунтится позже дочерних, так что подписаться мы всегда успеваем раньше).
    return useCartStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
