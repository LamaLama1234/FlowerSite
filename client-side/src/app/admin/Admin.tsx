"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useProfile } from "@/hooks/useProfile";
import { AdminProducts } from "./AdminProducts";
import { AdminCategories } from "./AdminCategories";
import { AdminOrders } from "./AdminOrders";
import { AdminAnalytics } from "./AdminAnalytics";

interface AdminProps {
  hasAccessToken: boolean;
}

type Tab = "products" | "categories" | "orders" | "analytics";

const TABS: { value: Tab; label: string }[] = [
  { value: "products", label: "Товары" },
  { value: "categories", label: "Категории" },
  { value: "orders", label: "Заказы" },
  { value: "analytics", label: "Аналитика" },
];

export function Admin({ hasAccessToken }: AdminProps) {
  const router = useRouter();
  const { data: user, isLoading } = useProfile(hasAccessToken);
  const [tab, setTab] = useState<Tab>("products");

  const isAdmin = user?.role === "ADMIN";

  // JWT не содержит роль, поэтому proxy.ts (edge) не может отфильтровать
  // не-админов заранее — проверяем роль здесь. Полная админка — только для
  // ADMIN; воркеров уводим в их собственный урезанный кабинет (см. /worker
  // и обоснование в order.service.ts getForWorker), остальных — на главную.
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace(user?.role === "WORKER" ? "/worker" : "/");
    }
  }, [isLoading, isAdmin, user?.role, router]);

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Загружаем…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Доступ запрещён</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="font-heading mb-6 text-3xl text-primary">
        Панель администратора
      </h1>

      <div className="border-gold-200/50 mb-8 flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" && <AdminProducts />}
      {tab === "categories" && <AdminCategories />}
      {tab === "orders" && <AdminOrders />}
      {tab === "analytics" && <AdminAnalytics />}
    </main>
  );
}
