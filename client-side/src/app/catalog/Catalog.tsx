"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { GoldDivider } from "@/components/decorative/GoldDivider";
import { SparkleField } from "@/components/decorative/SparkleField";

export function Catalog() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Дебаунс ввода, чтобы не дёргать API на каждое нажатие.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search]);

  // Переход из шапки может содержать ?category=<id> (кнопки быстрого
  // фильтра) — подхватываем его один раз при маунте. Как и с OAuth-кодом
  // на /dashboard, читаем window.location напрямую в эффекте, а не через
  // useSearchParams(), чтобы не тащить Suspense-границу ради этого.
  // Синхронный setState здесь намеренный: ленивая инициализация через
  // window в useState дала бы разные значения на SSR и при гидратации
  // (window не существует на сервере) — ровно тот hydration mismatch,
  // который уже приходилось чинить на /dashboard.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (category) setCategoryId(category);
  }, []);

  const { data: categories } = useCategories();
  const { data, isLoading, isError, refetch } = useProducts(
    debounced,
    categoryId || undefined,
  );
  const products = data?.items;
  const hasFilters = Boolean(debounced || categoryId);

  return (
    <main className="bg-celestial-pattern mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-primary">Каталог</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Букеты, растения и декор ручной работы
          </p>
        </div>

        <div className="glass-panel flex w-full flex-col gap-3 rounded-2xl p-3 sm:w-auto sm:flex-row">
          <div>
            <label htmlFor="catalog-category" className="sr-only">
              Категория
            </label>
            <select
              id="catalog-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="border-gold-200/50 focus:ring-gold-300/40 h-full w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 sm:w-48"
            >
              <option value="">Все категории</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <label htmlFor="catalog-search" className="sr-only">
              Поиск по каталогу
            </label>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              id="catalog-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию…"
              className="border-gold-200/50 focus:ring-gold-300/40 w-full rounded-lg border bg-background py-2.5 pr-3 pl-9 text-sm outline-none transition-colors focus:border-primary focus:ring-2"
            />
          </div>
        </div>
      </header>

      <GoldDivider variant="diamond" className="mb-8" />

      {isLoading ? (
        <ProductGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </ProductGrid>
      ) : isError ? (
        <Empty text="Не удалось загрузить товары. Попробуйте позже.">
          <Button variant="outline" onClick={() => refetch()}>
            Повторить
          </Button>
        </Empty>
      ) : !products?.length ? (
        <Empty
          text={
            debounced
              ? `По запросу «${debounced}» ничего не найдено`
              : hasFilters
                ? "По выбранной категории ничего не найдено"
                : "В каталоге пока нет товаров"
          }
        />
      ) : (
        <ProductGrid>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProductGrid>
      )}
    </main>
  );
}

function Empty({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-gold-200/60 relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-20 text-center">
      <SparkleField count={3} />
      <p className="text-muted-foreground relative">{text}</p>
      <span className="relative">{children}</span>
    </div>
  );
}
