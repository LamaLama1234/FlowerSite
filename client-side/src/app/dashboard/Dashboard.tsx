"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Package, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useOrders } from "@/hooks/useOrders";
import { authService } from "@/services/auth.service";
import type { IOrder } from "@/shared/types/order.interface";
import type { IUser } from "@/shared/types/user.interface";
import { formatPrice, resolveImageUrl } from "@/utils/product";
import { formatOrderDate, getOrderStatusMeta } from "@/utils/order";
import { CornerFlourish } from "@/components/decorative/CornerFlourish";
import { GoldDivider } from "@/components/decorative/GoldDivider";
import { SparkleField } from "@/components/decorative/SparkleField";

interface DashboardProps {
  hasAccessToken: boolean;
}

const ROLE_LABELS: Record<IUser["role"], string> = {
  USER: "Покупатель",
  ADMIN: "Администратор",
  WORKER: "Сотрудник",
};

export function Dashboard({ hasAccessToken }: DashboardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useProfile(hasAccessToken);
  const {
    data: orders,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
  } = useOrders(hasAccessToken);
  // OAuth-возврат: бэкенд кладёт в query одноразовый код (не JWT).
  // Обмениваем его на access-токен через бэкенд — сервер сверяет код
  // с oauth_state той же сессии браузера, прежде чем выдать токен.
  // isPending от мутации сам синхронизирует статус, без ручного useState —
  // эффект только инициирует обмен, а не пишет состояние напрямую.
  const exchangeCode = useMutation({
    mutationFn: (code: string) => authService.exchangeOAuthCode(code),
    onSuccess() {
      window.location.replace("/dashboard");
    },
    onError() {
      toast.error("Не удалось завершить вход");
      router.replace("/auth");
    },
  });
  const { mutate: exchangeCodeMutate } = exchangeCode;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    exchangeCodeMutate(code);
  }, [exchangeCodeMutate]);

  if (exchangeCode.isPending) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Завершаем вход…</p>
      </main>
    );
  }

  async function handleLogout() {
    try {
      await authService.logout();
      queryClient.removeQueries({ queryKey: ["profile"] });
      toast.success("Вы вышли из аккаунта");
      router.push("/auth");
    } catch {
      toast.error("Не удалось выйти");
    }
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Загружаем профиль…</p>
      </main>
    );
  }

  if (isError || !user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive">Не удалось загрузить профиль</p>
        <Button onClick={() => router.push("/auth")}>На страницу входа</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary">
            Личный кабинет
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Добро пожаловать, {user.name || user.email}
          </p>
        </div>
        <Button variant="outline" size="lg" onClick={handleLogout}>
          <LogOut className="size-4" />
          Выйти
        </Button>
      </header>

      <section className="glass-panel relative mb-10 flex items-center gap-4 rounded-2xl p-6">
        <CornerFlourish corner="tl" />
        <CornerFlourish corner="br" />
        <span className="bg-primary/10 text-primary relative flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </span>
        <div className="relative min-w-0 flex-1">
          <p className="truncate font-semibold">{user.name || "Без имени"}</p>
          <p className="text-muted-foreground truncate text-sm">
            {user.email}
          </p>
        </div>
        <span className="bg-primary/10 text-primary relative shrink-0 rounded-full px-3 py-1 text-xs font-medium">
          {ROLE_LABELS[user.role]}
        </span>
      </section>

      <GoldDivider variant="flower" className="mb-10" />

      <section>
        <h2 className="font-heading mb-4 text-xl text-primary">
          История заказов
        </h2>

        {isOrdersLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : isOrdersError ? (
          <Empty text="Не удалось загрузить заказы. Попробуйте позже." />
        ) : !orders?.length ? (
          <Empty text="У вас пока нет заказов">
            <Button asChild>
              <Link href="/catalog">Перейти в каталог</Link>
            </Button>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function OrderCard({ order }: { order: IOrder }) {
  const status = getOrderStatusMeta(order.status);

  return (
    <article className="border-gold-200/50 border-l-gold-400 rounded-2xl border border-l-4 bg-card p-5 transition-colors hover:border-gold-300/70">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="text-muted-foreground size-4" />
          <div>
            <p className="text-sm font-medium">
              Заказ №{order.id.slice(-6)}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatOrderDate(order.createdAt)}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {order.items.map((item) => {
          const image = resolveImageUrl(item.product.images?.[0]);

          return (
            <li key={item.id} className="flex items-center gap-3 text-sm">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                {image && (
                  <Image
                    src={image}
                    alt={item.product.title}
                    fill
                    unoptimized
                    sizes="40px"
                    className="object-cover"
                  />
                )}
              </div>
              <span className="flex-1 truncate">{item.product.title}</span>
              <span className="text-muted-foreground shrink-0">
                × {item.quantity}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
        <span>Итого</span>
        <span>{formatPrice(order.total)}</span>
      </div>
    </article>
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
    <div className="border-gold-200/60 relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 text-center">
      <SparkleField count={3} />
      <ShoppingBag className="text-gold-400 relative size-8" />
      <p className="text-muted-foreground relative">{text}</p>
      <span className="relative">{children}</span>
    </div>
  );
}
