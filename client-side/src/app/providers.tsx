'use client'


import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider} from '@tanstack/react-query'
import { Toaster } from "react-hot-toast";
import { useCartStore } from "@/stores/cart.store";

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
    }, [])

    return (
        <QueryClientProvider client={client}>  
            <Toaster />
            {children}

        </QueryClientProvider>
    )
}