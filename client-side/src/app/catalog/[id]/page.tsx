import type { Metadata } from "next";

import { ProductDetail } from "./ProductDetail";

export const metadata: Metadata = {
  title: "Товар",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProductDetail id={id} />;
}
