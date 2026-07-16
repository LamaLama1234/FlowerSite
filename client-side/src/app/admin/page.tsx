import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Admin } from "./Admin";

export const metadata: Metadata = {
  title: "Панель администратора",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Та же схема, что и в /dashboard: читаем cookie из реального запроса
  // (next/headers), а не через document.cookie — иначе SSR и клиент
  // разойдутся во мнении о наличии токена и словим hydration mismatch.
  const cookieStore = await cookies();
  const hasAccessToken = cookieStore.has("accessToken");

  return <Admin hasAccessToken={hasAccessToken} />;
}
