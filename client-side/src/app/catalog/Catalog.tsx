"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { GoldDivider } from "@/components/decorative/GoldDivider";
import { SparkleField } from "@/components/decorative/SparkleField";
import type { ProductSortBy } from "@/shared/types/product.interface";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: ProductSortBy; label: string }[] = [
  { value: "popularity", label: "Сначала популярные" },
  { value: "newest", label: "Сначала новые" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
];

export function Catalog() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState<ProductSortBy>("popularity");
  const [discountedOnly, setDiscountedOnly] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState({
    debounced,
    categoryId,
    sortBy,
    discountedOnly,
    priceRange,
  });

  // Дебаунс ввода, чтобы не дёргать API на каждое нажатие.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search]);

  // Тот же дебаунс для полей цены "от"/"до".
  useEffect(() => {
    const id = setTimeout(
      () =>
        setPriceRange({
          min: minPriceInput.trim(),
          max: maxPriceInput.trim(),
        }),
      400,
    );
    return () => clearTimeout(id);
  }, [minPriceInput, maxPriceInput]);

  // Смена любого фильтра всегда возвращает на первую страницу — иначе
  // можно застрять на странице 5, для которой уже нет результатов. Сравнение
  // прямо в рендере (а не в эффекте) — рекомендованный React-паттерн для
  // сброса состояния при смене "входных" пропсов/значений.
  if (
    appliedFilters.debounced !== debounced ||
    appliedFilters.categoryId !== categoryId ||
    appliedFilters.sortBy !== sortBy ||
    appliedFilters.discountedOnly !== discountedOnly ||
    appliedFilters.priceRange.min !== priceRange.min ||
    appliedFilters.priceRange.max !== priceRange.max
  ) {
    setAppliedFilters({ debounced, categoryId, sortBy, discountedOnly, priceRange });
    setPage(1);
  }

  // Восстанавливаем все фильтры из query-строки — так и переход из шапки/
  // главной с ?category=<id>, и возврат кнопкой "Назад в каталог" со страницы
  // товара (см. ProductDetail.tsx — там router.back(), а не Link на голый
  // /catalog) приходят на тот же набор фильтров. useSearchParams() (а не
  // window.location.search в mount-only эффекте) — намеренно: App Router не
  // перемонтирует Catalog при клиентской навигации между двумя /catalog?
  // category=... с одного маршрута, а window.location в эффекте с [] тогда
  // просто не перечитался бы. useSearchParams реактивен к таким переходам.
  // Заодно синхронизируем appliedFilters/page тем же значением — иначе
  // эффект ниже (сброс страницы при смене фильтров) увидит "изменение" и
  // тут же обнулит восстановленную страницу обратно на первую.
  const searchParams = useSearchParams();
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const urlCategoryId = params.get("category") ?? "";
    const urlSearch = params.get("q") ?? "";
    const urlSortBy = (params.get("sort") as ProductSortBy | null) ?? "popularity";
    const urlDiscountedOnly = params.get("discounted") === "true";
    const urlMinPrice = params.get("min") ?? "";
    const urlMaxPrice = params.get("max") ?? "";
    const urlPage = Math.max(1, Number(params.get("page")) || 1);
    const urlPriceRange = { min: urlMinPrice, max: urlMaxPrice };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategoryId(urlCategoryId);
    setSearch(urlSearch);
    setDebounced(urlSearch);
    setSortBy(urlSortBy);
    setDiscountedOnly(urlDiscountedOnly);
    setMinPriceInput(urlMinPrice);
    setMaxPriceInput(urlMaxPrice);
    setPriceRange(urlPriceRange);
    setPage(urlPage);
    setAppliedFilters({
      debounced: urlSearch,
      categoryId: urlCategoryId,
      sortBy: urlSortBy,
      discountedOnly: urlDiscountedOnly,
      priceRange: urlPriceRange,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Зеркалим текущие применённые фильтры в адресную строку — replaceState,
  // не push, чтобы не плодить историю на каждое изменение фильтра (иначе
  // "Назад" из браузера пришлось бы жать по многу раз). Это чтение URL при
  // возврате (эффект выше) и есть весь механизм "сохранения" фильтров.
  useEffect(() => {
    const params = new URLSearchParams();
    if (appliedFilters.categoryId) params.set("category", appliedFilters.categoryId);
    if (appliedFilters.debounced) params.set("q", appliedFilters.debounced);
    if (appliedFilters.sortBy !== "popularity") params.set("sort", appliedFilters.sortBy);
    if (appliedFilters.discountedOnly) params.set("discounted", "true");
    if (appliedFilters.priceRange.min) params.set("min", appliedFilters.priceRange.min);
    if (appliedFilters.priceRange.max) params.set("max", appliedFilters.priceRange.max);
    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [appliedFilters, page]);

  const minPrice = priceRange.min ? Number(priceRange.min) : undefined;
  const maxPrice = priceRange.max ? Number(priceRange.max) : undefined;

  const { data: categories } = useCategories();
  const { data, isLoading, isError, refetch } = useProducts({
    searchTerm: debounced,
    categoryId: categoryId || undefined,
    page,
    limit: PAGE_SIZE,
    minPrice,
    maxPrice,
    sortBy,
    discounted: discountedOnly,
  });
  const products = data?.items;
  const hasFilters = Boolean(
    debounced || categoryId || discountedOnly || priceRange.min || priceRange.max,
  );
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <main className="bg-celestial-pattern mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <header className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary">Каталог</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Букеты, растения и декор ручной работы
          </p>
        </div>

        <div className="glass-panel flex flex-col gap-3 rounded-2xl p-3 lg:flex-row lg:flex-wrap lg:items-end">
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

          <div>
            <span className="text-muted-foreground mb-1 block text-xs" id="catalog-price-label">
              Цена, ₽
            </span>
            <div
              className="flex items-center gap-1.5"
              role="group"
              aria-labelledby="catalog-price-label"
            >
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                placeholder="от"
                aria-label="Цена от"
                className="border-gold-200/50 focus:ring-gold-300/40 w-20 rounded-lg border bg-background px-2.5 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2"
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                placeholder="до"
                aria-label="Цена до"
                className="border-gold-200/50 focus:ring-gold-300/40 w-20 rounded-lg border bg-background px-2.5 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="catalog-sort" className="sr-only">
              Сортировка
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProductSortBy)}
              className="border-gold-200/50 focus:ring-gold-300/40 h-full w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 sm:w-44"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <label className="border-gold-200/50 flex h-full items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm select-none">
            <input
              type="checkbox"
              checked={discountedOnly}
              onChange={(e) => setDiscountedOnly(e.target.checked)}
              className="accent-primary size-4"
            />
            Со скидкой
          </label>

          <div className="relative w-full lg:ml-auto lg:w-72">
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
                ? "По выбранным фильтрам ничего не найдено"
                : "В каталоге пока нет товаров"
          }
        />
      ) : (
        <>
          <ProductGrid>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-muted-foreground text-sm">
                Страница {page} из {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Следующая страница"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
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
