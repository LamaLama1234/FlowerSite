"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Leaf, LogOut, Menu, ShoppingBag, X } from "lucide-react";
import toast from "react-hot-toast";

import { useProfile } from "@/hooks/useProfile";
import { authService } from "@/services/auth.service";
import { useCartCount } from "@/stores/cart.store";
import { useFavoritesCount } from "@/stores/favorites.store";
import { CornerFlourish } from "@/components/decorative/CornerFlourish";

export function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useProfile();
  const cartCount = useCartCount();
  const favoritesCount = useFavoritesCount();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await authService.logout();
      queryClient.removeQueries({ queryKey: ["profile"] });
      toast.success("Вы вышли из аккаунта");
      setMenuOpen(false);
      router.push("/auth");
      router.refresh();
    } catch {
      toast.error("Не удалось выйти");
    }
  }

  return (
    <header className="sticky top-0 z-50 overflow-hidden bg-gradient-to-r from-white via-emerald-50/60 to-white shadow-sm backdrop-blur dark:from-neutral-950 dark:via-emerald-950/40 dark:to-neutral-950">
      {/* Мягкий "небесный" отблеск сверху — золото используем как свет, не как заливку */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(184,147,91,0.16),transparent)]" />

      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group relative flex items-center gap-2.5">
          <CornerFlourish
            corner="tl"
            className="pointer-events-none -top-3 -left-3 size-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          <span className="ring-gold-300/40 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_18px_2px_rgba(184,147,91,0.22)] ring-1 transition-all duration-300 group-hover:ring-2 group-hover:ring-gold-400/70 group-hover:shadow-[0_0_26px_4px_rgba(184,147,91,0.4)]">
            <Leaf className="size-5" />
          </span>
          <span className="font-heading text-xl tracking-wide text-primary">
            GreenArt
          </span>
        </Link>

        <nav className="hidden items-center gap-5 sm:flex">
          <Link
            href="/catalog"
            className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
          >
            Каталог
          </Link>

          <Link
            href="/favorites"
            className="text-muted-foreground hover:text-primary relative transition-colors"
            aria-label="Избранное"
          >
            <Heart className="size-5" />
            {favoritesCount > 0 && (
              <span className="bg-gold-500 absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full text-[0.625rem] font-semibold text-white">
                {favoritesCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="text-muted-foreground hover:text-primary relative transition-colors"
            aria-label="Корзина"
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="bg-gold-500 absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full text-[0.625rem] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-primary max-w-32 truncate text-sm font-medium transition-colors"
              >
                {user.name || user.email}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="border-border hover:border-primary/50 hover:text-primary flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all"
              >
                <LogOut className="size-4" />
                Выйти
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="ring-gold-300/50 rounded-full bg-gradient-to-r from-primary to-emerald-600 px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_14px_1px_rgba(184,147,91,0.2)] ring-1 transition-all hover:ring-2 hover:ring-gold-400/70 hover:shadow-[0_0_22px_3px_rgba(184,147,91,0.4)]"
            >
              Войти
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 sm:hidden">
          <Link
            href="/favorites"
            className="text-muted-foreground hover:text-primary relative transition-colors"
            aria-label="Избранное"
          >
            <Heart className="size-5" />
            {favoritesCount > 0 && (
              <span className="bg-gold-500 absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full text-[0.625rem] font-semibold text-white">
                {favoritesCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="text-muted-foreground hover:text-primary relative transition-colors"
            aria-label="Корзина"
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="bg-gold-500 absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full text-[0.625rem] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {menuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-gold-200/40 bg-background relative flex flex-col gap-1 border-t px-4 py-3 sm:hidden">
          <Link
            href="/catalog"
            onClick={() => setMenuOpen(false)}
            className="text-foreground hover:text-primary hover:bg-muted rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            Каталог
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="text-foreground hover:text-primary hover:bg-muted truncate rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              >
                {user.name || user.email}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-foreground hover:text-primary hover:bg-muted flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
              >
                <LogOut className="size-4" />
                Выйти
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              onClick={() => setMenuOpen(false)}
              className="text-primary hover:bg-muted rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
            >
              Войти
            </Link>
          )}
        </nav>
      )}

      {/* Тонкая золотая грань снизу — как прожилка мрамора, не сплошная линия */}
      <div className="via-gold-300/60 relative h-px bg-gradient-to-r from-transparent to-transparent" />
    </header>
  );
}
