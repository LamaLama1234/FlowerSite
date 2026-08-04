'use client'


import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider} from '@tanstack/react-query'
import { Toaster } from "react-hot-toast";
import { LazyMotion, domAnimation } from "motion/react";
import { useCartStore } from "@/stores/cart.store";
import { useFavoritesStore } from "@/stores/favorites.store";
import { PromoBadge } from "@/components/PromoBadge";

export function Providers({ children }: PropsWithChildren) {
    const [client] = useState(
        new QueryClient({
            defaultOptions: {
                queries: {
                    refetchOnWindowFocus: false
                }
            }
        })
    )

    // Корзина хранится в localStorage, которого нет на сервере — читаем её
    // только после маунта, чтобы первый клиентский рендер совпадал с SSR.
    useEffect(() => {
        useCartStore.persist.rehydrate()
        useFavoritesStore.persist.rehydrate()
    }, [])

    return (
        <QueryClientProvider client={client}>
            {/* domAnimation вместо полного набора фич — держит бандл Motion в районе 5-6 КБ gzip,
                этого достаточно для fade/slide/stagger, drag и layout-анимации не используем. */}
            <LazyMotion features={domAnimation} strict>
                <Toaster />
                <PromoBadge />
                {children}
            </LazyMotion>
        </QueryClientProvider>
    )
}