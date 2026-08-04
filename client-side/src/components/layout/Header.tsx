"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, LogOut, Menu, ShoppingBag, X } from "lucide-react";
import toast from "react-hot-toast";
import { AnimatePresence, m } from "motion/react";

import { useProfile } from "@/hooks/useProfile";
import { authService } from "@/services/auth.service";
import { useCartCount } from "@/stores/cart.store";
import { useFavoritesCount } from "@/stores/favorites.store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: user } = useProfile();
  const cartCount = useCartCount();
  const favoritesCount = useFavoritesCount();
  const [menuOpen, setMenuOpen] = useState(false);

  const isCatalogActive = pathname?.startsWith("/catalog");
  const isDashboardActive = pathname?.startsWith("/dashboard");

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
    <header className="border-gold-200/40 bg-background sticky top-0 z-50 border-b shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="GreenArt"
            width={58}
            height={48}
            className="shrink-0"
            priority
          />
          <span className="font-heading text-xl tracking-wide text-primary transition-opacity duration-150 hover:opacity-70">
            GreenArt
          </span>
        </Link>

        <nav className="hidden items-center gap-5 sm:flex">
          <Link
            href="/catalog"
            aria-current={isCatalogActive ? "page" : undefined}
            className={cn(
              "hover:text-primary border-b-2 border-transparent pb-0.5 text-sm font-medium transition-colors",
              isCatalogActive
                ? "text-primary border-primary"
                : "text-muted-foreground",
            )}
          >
            Каталог
          </Link>

          <Link
            href="/favorites"
            className="text-muted-foreground hover:text-primary relative transition-colors"
            aria-label="Избранное"
          >
            <Heart className="size-5" />
            <CountBadge count={favoritesCount} />
          </Link>

          <Link
            href="/cart"
            className="text-muted-foreground hover:text-primary relative transition-colors"
            aria-label="Корзина"
          >
            <ShoppingBag className="size-5" />
            <CountBadge count={cartCount} />
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                aria-current={isDashboardActive ? "page" : undefined}
                className={cn(
                  "hover:text-primary max-w-32 truncate border-b-2 border-transparent pb-0.5 text-sm font-medium transition-colors",
                  isDashboardActive
                    ? "text-primary border-primary"
                    : "text-muted-foreground",
                )}
              >
                {user.name || user.email}
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4" />
                Выйти
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">Войти</Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-4 sm:hidden">
          <Link
            href="/favorites"
            className="text-muted-foreground hover:text-primary relative transition-colors"
            aria-label="Избранное"
          >
            <Heart className="size-5" />
            <CountBadge count={favoritesCount} />
          </Link>

          <Link
            href="/cart"
            className="text-muted-foreground hover:text-primary relative transition-colors"
            aria-label="Корзина"
          >
            <ShoppingBag className="size-5" />
            <CountBadge count={cartCount} />
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

      <AnimatePresence initial={false}>
        {menuOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden sm:hidden"
          >
            <nav className="border-gold-200/40 bg-background relative flex flex-col gap-1 border-t px-4 py-3">
              <Link
                href="/catalog"
                onClick={() => setMenuOpen(false)}
                aria-current={isCatalogActive ? "page" : undefined}
                className={cn(
                  "hover:text-primary hover:bg-muted rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isCatalogActive ? "text-primary bg-muted" : "text-foreground",
                )}
              >
                Каталог
              </Link>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    aria-current={isDashboardActive ? "page" : undefined}
                    className={cn(
                      "hover:text-primary hover:bg-muted truncate rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isDashboardActive ? "text-primary bg-muted" : "text-foreground",
                    )}
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
          </m.div>
        )}
      </AnimatePresence>

      {/* Тонкая золотая грань снизу — как прожилка мрамора, не сплошная линия */}
      <div className="via-gold-300/60 relative h-px bg-gradient-to-r from-transparent to-transparent" />
    </header>
  );
}

// key={count} — при каждом изменении числа бейдж перемаунтится и коротко
// "подпрыгивает", это и есть обратная связь о добавлении/удалении товара.
function CountBadge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <m.span
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-gold-500 absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full text-[0.625rem] font-semibold text-white"
        >
          {count}
        </m.span>
      )}
    </AnimatePresence>
  );
}
