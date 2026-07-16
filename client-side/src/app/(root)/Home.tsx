"use client";

import Link from "next/link";
import { ArrowRight, Flower2, Leaf, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { usePopularProducts } from "@/hooks/usePopularProducts";
import { useCategories } from "@/hooks/useCategories";
import { findCategoryByTitle } from "@/utils/category";
import { GoldDivider } from "@/components/decorative/GoldDivider";
import { CornerFlourish } from "@/components/decorative/CornerFlourish";
import { SparkleField } from "@/components/decorative/SparkleField";
import { BranchMotif } from "@/components/decorative/BranchMotif";

export function Home() {
  const { data: popularProducts, isLoading, isError } = usePopularProducts();
  const showPopular = isLoading || (!isError && !!popularProducts?.length);

  const { data: categories } = useCategories();
  const customBouquets = findCategoryByTitle(categories, "Сборные букеты");
  const readyBouquets = findCategoryByTitle(categories, "Готовые букеты");
  const showBouquetPicker = Boolean(customBouquets || readyBouquets);

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-background to-emerald-100 dark:from-emerald-950/40 dark:via-background dark:to-emerald-900/30">
        <SparkleField count={5} />
        <BranchMotif className="pointer-events-none absolute -top-6 -right-10 size-56 text-gold-400/25 sm:size-72" />
        <BranchMotif className="pointer-events-none absolute -bottom-10 -left-10 size-56 rotate-180 text-gold-400/20 sm:size-72" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32">
          <span className="glass-panel ring-gold-200/50 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-primary ring-1">
            <Sparkles className="text-gold-500 size-4" />
            Свежесть и эстетика каждый день
          </span>

          <h1 className="font-heading max-w-3xl text-4xl tracking-tight text-balance sm:text-6xl">
            GreenArt — Цветы и искусство
            <span className="text-primary"> в вашем доме</span>
          </h1>

          <p className="text-muted-foreground max-w-xl text-lg text-pretty">
            Авторские букеты, растения и декор ручной работы. Превращаем
            обычные дни в маленькие праздники — с заботой о каждой детали.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/catalog">
                Перейти в каталог
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="/auth">Войти</Link>
            </Button>
          </div>
        </div>
      </section>

      <GoldDivider variant="flower" className="py-10" />

      {/* Популярные товары */}
      {showPopular && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Популярные товары
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                То, что чаще всего выбирают наши покупатели
              </p>
            </div>
            <Link
              href="/catalog"
              className="text-primary hover:text-primary/80 hidden shrink-0 items-center gap-1 text-sm font-medium sm:flex"
            >
              Весь каталог
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {isLoading ? (
            <ProductGrid>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </ProductGrid>
          ) : (
            <ProductGrid>
              {(popularProducts ?? []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ProductGrid>
          )}
        </section>
      )}

      {showPopular && showBouquetPicker && <GoldDivider variant="sparkle" />}

      {/* Выбор букета */}
      {showBouquetPicker && (
        <section className="bg-celestial-pattern mx-auto w-full max-w-6xl px-4 py-16">
          <div className="mb-8 text-center">
            <h2 className="font-heading text-2xl text-primary sm:text-3xl">
              Выберите свой букет
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Готовая композиция от флориста или свобода собрать свою
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {customBouquets && (
              <CategoryCta
                href={`/catalog?category=${customBouquets.id}`}
                icon={<Sparkles className="size-7" />}
                title="Сборные букеты"
                text="Выберите цветы поштучно и соберите композицию под настроение и повод"
              />
            )}
            {readyBouquets && (
              <CategoryCta
                href={`/catalog?category=${readyBouquets.id}`}
                icon={<Flower2 className="size-7" />}
                title="Готовые букеты"
                text="Авторские композиции от флористов — выбирайте и заказывайте сразу"
              />
            )}
          </div>
        </section>
      )}

      <GoldDivider variant="diamond" />

      {/* Преимущества */}
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3">
        <Feature
          icon={<Flower2 className="size-6" />}
          title="Авторские букеты"
          text="Каждую композицию флористы собирают вручную из свежих сезонных цветов."
        />
        <Feature
          icon={<Leaf className="size-6" />}
          title="Живые растения"
          text="Здоровые растения для дома и офиса с понятными советами по уходу."
        />
        <Feature
          icon={<Sparkles className="size-6" />}
          title="Бережная доставка"
          text="Доставим вовремя и в идеальном виде — красота не пострадает в пути."
        />
      </section>
    </main>
  );
}

function CategoryCta({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="ring-gold-300/40 group relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-gold-50 p-8 shadow-[0_0_30px_-6px_rgba(184,147,91,0.25)] ring-1 transition-all hover:-translate-y-1 hover:ring-2 hover:ring-gold-400/70 hover:shadow-[0_0_45px_-6px_rgba(184,147,91,0.45)] dark:from-emerald-950/40 dark:via-background dark:to-gold-700/20"
    >
      <CornerFlourish corner="tr" className="text-gold-400/50 size-10" />

      {/* Мягкий "небесный" блик в углу — мрамор с золотой прожилкой, не заливка */}
      <div className="pointer-events-none absolute -top-10 -left-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),transparent_70%)] opacity-70" />
      <Sparkles className="text-gold-400/15 pointer-events-none absolute -right-4 -bottom-4 size-28 transition-transform duration-300 group-hover:scale-110" />

      <span className="bg-primary text-primary-foreground ring-gold-300/50 relative flex size-14 items-center justify-center rounded-2xl shadow-sm ring-1 transition-transform duration-300 group-hover:scale-105">
        {icon}
      </span>

      <div className="relative">
        <h3 className="font-heading text-2xl text-primary">{title}</h3>
        <p className="text-muted-foreground mt-2 text-sm">{text}</p>
      </div>

      <span className="text-primary relative mt-auto inline-flex items-center gap-1.5 text-sm font-semibold">
        Смотреть каталог
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border-gold-200/50 hover:border-gold-300/70 relative rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-900/5">
      <span className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-xl">
        {icon}
      </span>
      <h3 className="font-heading mb-1.5 text-lg text-primary">{title}</h3>
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}
