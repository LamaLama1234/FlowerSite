import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Worker } from "./Worker";

export const metadata: Metadata = {
  title: "Кабинет сотрудника",
  robots: { index: false, follow: false },
};

export default async function WorkerPage() {
  const cookieStore = await cookies();
  const hasAccessToken = cookieStore.has("accessToken");

  return <Worker hasAccessToken={hasAccessToken} />;
}
