import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { IProduct } from "@/shared/types/product.interface";

interface FavoritesState {
  items: IProduct[];
  toggle: (product: IProduct) => void;
  remove: (productId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) => {
        const items = get().items;
        const exists = items.some((item) => item.id === product.id);

        set({
          items: exists
            ? items.filter((item) => item.id !== product.id)
            : [...items, product],
        });
      },

      remove: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },
    }),
    {
      name: "greenart-favorites",
      // См. cart.store.ts — та же причина: localStorage недоступен на
      // сервере, подставляем no-op хранилище, чтобы persist существовал
      // всегда, а не только после гидратации на клиенте.
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : localStorage,
      ),
      skipHydration: true,
    },
  ),
);

export const useFavoritesCount = () =>
  useFavoritesStore((state) => state.items.length);

export const useIsFavorite = (productId: string) =>
  useFavoritesStore((state) =>
    state.items.some((item) => item.id === productId),
  );

/** См. useCartHasHydrated в cart.store.ts — тот же паттерн. */
export function useFavoritesHasHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useFavoritesStore.persist.hasHydrated(),
  );

  useEffect(() => {
    return useFavoritesStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
  }, []);

  return hydrated;
}
