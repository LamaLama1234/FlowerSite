"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { ProductCard } from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/useProducts";

export function Catalog() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // Дебаунс ввода, чтобы не дёргать API на каждое нажатие.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search]);

  const { data: products, isLoading, isError } = useProducts(debounced);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Каталог</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Букеты, растения и декор ручной работы
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию…"
            className="w-full rounded-lg border border-border bg-background py-2.5 pr-3 pl-9 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </header>

      {isLoading ? (
        <Grid>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </Grid>
      ) : isError ? (
        <Empty text="Не удалось загрузить товары. Попробуйте позже." />
      ) : !products?.length ? (
        <Empty
          text={
            debounced
              ? `По запросу «${debounced}» ничего не найдено`
              : "В каталоге пока нет товаров"
          }
        />
      ) : (
        <Grid>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Grid>
      )}
    </main>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
