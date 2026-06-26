import type { Metadata } from "next";

import { Catalog } from "./Catalog";

export const metadata: Metadata = {
  title: "Каталог",
  description: "Букеты, растения и декор ручной работы от GreenArt",
};

export default function CatalogPage() {
  return <Catalog />;
}
