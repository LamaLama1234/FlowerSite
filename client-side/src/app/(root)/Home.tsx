"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flower2, Leaf, Sparkles } from "lucide-react";
import { m, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/ui/carousel";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { usePopularProducts } from "@/hooks/usePopularProducts";
import { useDiscountedProducts } from "@/hooks/useDiscountedProducts";
import { useCategoryChampions } from "@/hooks/useCategoryChampions";
import { useCategories } from "@/hooks/useCategories";
import { findCategoryByTitle } from "@/utils/category";
import { resolveImageUrl } from "@/utils/product";
import { GoldDivider } from "@/components/decorative/GoldDivider";
import { SparkleField } from "@/components/decorative/SparkleField";
import { cn } from "@/lib/utils";

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function Home() {
  const { data: popularProducts, isLoading, isError } = usePopularProducts();
  const showPopular = isLoading || (!isError && !!popularProducts?.length);

  const {
    data: discountedProducts,
    isLoading: isDiscountedLoading,
    isError: isDiscountedError,
  } = useDiscountedProducts();
  const showDiscounted =
    isDiscountedLoading || (!isDiscountedError && !!discountedProducts?.length);

  const { data: categories } = useCategories();
  const customBouquets = findCategoryByTitle(categories, "Сборные букеты");
  const readyBouquets = findCategoryByTitle(categories, "Готовые букеты");
  const baskets = findCategoryByTitle(categories, "Корзинки");
  const edibleBouquets = findCategoryByTitle(categories, "Съедобные букеты");
  const showBouquetPicker = Boolean(
    customBouquets || readyBouquets || baskets || edibleBouquets,
  );

  const { data: championsData } = useCategoryChampions();
  const champions = (championsData ?? [])
    .map((entry) => ({
      key: entry.category.id,
      src: resolveImageUrl(entry.product.images?.[0]),
      alt: entry.product.title,
      categoryId: entry.category.id,
      categoryTitle: entry.category.title,
    }))
    .filter(
      (slide): slide is typeof slide & { src: string } => !!slide.src,
    );

  const heroSlides = champions.map((slide, i) => (
    <div key={slide.key} className="relative size-full">
      <Image
        src={slide.src}
        alt={slide.alt}
        fill
        unoptimized
        priority={i === 0}
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="object-cover"
      />
      {/* Затемнение — чтобы белый текст читался на любом фото. */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
        <span
          style={{ fontFamily: "var(--font-tenor)" }}
          className="text-4xl tracking-[0.2em] text-white uppercase sm:text-5xl"
        >
          GreenArt
        </span>
        <span className="font-heading text-xl text-white/90 italic sm:text-2xl">
          {slide.categoryTitle}
        </span>
        <Link
          href={`/catalog?category=${slide.categoryId}`}
          className="border border-white px-8 py-2.5 text-sm tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-primary"
        >
          Смотреть
        </Link>
      </div>
    </div>
  ));

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="bg-background relative overflow-hidden">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
          <m.div
            initial="hidden"
            animate="show"
            variants={heroContainer}
            className="relative flex h-full flex-col items-start gap-6 pt-10 text-left lg:pt-16"
          >
            <m.span
              variants={heroItem}
              className="glass-panel ring-gold-200/50 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-primary ring-1"
            >
              <Sparkles className="text-gold-500 size-4" />
              Свежесть и эстетика каждый день
            </m.span>

            <m.h1
              variants={heroItem}
              style={{ fontFamily: "var(--font-tenor)" }}
              className="max-w-md text-4xl tracking-[0.15em] text-balance uppercase sm:text-6xl"
            >
              GreenArt
            </m.h1>

            <m.p
              variants={heroItem}
              className="text-muted-foreground max-w-md text-lg text-pretty"
            >
              Цветы и искусство в вашем доме — авторские букеты, растения и
              декор ручной работы. Превращаем обычные дни в маленькие
              праздники, с заботой о каждой детали.
            </m.p>

            <m.div variants={heroItem} className="mt-2 flex flex-wrap items-center gap-3">
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
            </m.div>

            {showBouquetPicker && (
              <m.div variants={heroItem} className="grid w-full flex-1 grid-cols-2 grid-rows-2 gap-3">
                {readyBouquets && (
                  <BouquetCta
                    href={`/catalog?category=${readyBouquets.id}`}
                    image="/tile-ready.png"
                    bgClassName="bg-rose-50"
                    fit="contain"
                    imageWidthClassName="w-1/2"
                    title="Готовые букеты"
                    text="Авторские композиции — выбирайте и заказывайте сразу"
                  />
                )}
                {customBouquets && (
                  <BouquetCta
                    href={`/catalog?category=${customBouquets.id}`}
                    image="/tile-custom.png"
                    bgClassName="bg-primary/5"
                    fit="contain"
                    title="Сборные букеты"
                    text="Выберите цветы поштучно под настроение и повод"
                  />
                )}
                {baskets && (
                  <BouquetCta
                    href={`/catalog?category=${baskets.id}`}
                    image="/tile-basket.png"
                    bgClassName="bg-gold-50"
                    fit="contain"
                    title="Корзинки"
                    text="Держат форму дольше вазы, не нужна вода в пути"
                  />
                )}
                {edibleBouquets && (
                  <BouquetCta
                    href={`/catalog?category=${edibleBouquets.id}`}
                    image="/tile-edible.png"
                    bgClassName="bg-orange-50"
                    fit="contain"
                    imageWidthClassName="w-1/2"
                    title="Съедобные букеты"
                    text="Клубника в шоколаде и фруктовые композиции"
                  />
                )}
              </m.div>
            )}
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="relative"
          >
            <SparkleField count={4} className="hidden lg:block" />
            {heroSlides.length > 0 ? (
              <Carousel
                slides={heroSlides}
                aspectClassName="aspect-[4/5]"
                autoplay
                autoplayInterval={4500}
                className="shadow-sm"
              />
            ) : (
              <div className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
            )}
          </m.div>
        </div>
      </section>

      <GoldDivider variant="flower" className="py-10" />

      {/* Букеты со скидкой */}
      {showDiscounted && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Букеты со скидкой
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Успейте выбрать, пока действует скидка
            </p>
          </div>

          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {isDiscountedLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] w-56 shrink-0 animate-pulse rounded-2xl bg-muted"
                  />
                ))
              : discountedProducts!.map((product) => (
                  <div key={product.id} className="w-56 shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
          </div>
        </section>
      )}

      {showDiscounted && showPopular && <GoldDivider variant="sparkle" />}

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

      <GoldDivider variant="sparkle" />

      {/* Соцсети */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
        <h2 className="font-heading text-2xl text-primary sm:text-3xl">
          Мы в соцсетях
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Свежие фото букетов, акции и новости — подписывайтесь
        </p>
        <Button asChild size="lg" className="mt-6 h-11 px-6 text-base">
          <Link href="/social">
            Наши соцсети
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </main>
  );
}

function BouquetCta({
  href,
  image,
  bgClassName,
  fit = "cover",
  imageWidthClassName = "w-2/5",
  title,
  text,
}: {
  href: string;
  image?: string;
  bgClassName?: string;
  fit?: "cover" | "contain";
  imageWidthClassName?: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full items-stretch overflow-hidden rounded-2xl",
        bgClassName,
      )}
    >
      <div className="relative z-10 flex flex-1 flex-col justify-between gap-1 p-3.5">
        <div>
          <h3 className="font-heading text-primary text-sm sm:text-base">
            {title}
          </h3>
          <p className="text-muted-foreground/80 mt-1 text-[0.7rem] leading-snug sm:text-xs">
            {text}
          </p>
        </div>

        <span className="text-primary inline-flex items-center gap-1 text-[0.65rem] font-semibold tracking-widest uppercase">
          Смотреть
          <ArrowRight className="size-3" />
        </span>
      </div>

      {image && (
        <div className={cn("relative shrink-0", imageWidthClassName)}>
          <Image
            src={image}
            alt=""
            fill
            unoptimized
            sizes="200px"
            className={cn(
              "transition-transform duration-300 group-hover:scale-105",
              fit === "contain"
                ? "object-contain object-bottom p-1"
                : "object-cover",
            )}
          />
        </div>
      )}
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
    <div className="border-gold-200/50 hover:border-gold-300/70 rounded-2xl border bg-card p-6 transition-colors duration-150">
      <span className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-xl">
        {icon}
      </span>
      <h3 className="font-heading mb-1.5 text-lg text-primary">{title}</h3>
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}
