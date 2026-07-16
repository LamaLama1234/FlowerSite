import type { Metadata } from "next";
import { cookies } from "next/headers";

import { NO_INDEX_PAGE } from "constants/seo.constants";

import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Личный кабинет",
  ...NO_INDEX_PAGE,
};

export default async function DashboardPage() {
  // Читаем cookie из реального запроса (next/headers), а не через
  // document.cookie (js-cookie) — иначе на SSR токен всегда "не виден",
  // а на клиенте виден, и React ловит hydration mismatch.
  const cookieStore = await cookies();
  const hasAccessToken = cookieStore.has("accessToken");

  return <Dashboard hasAccessToken={hasAccessToken} />;
}
