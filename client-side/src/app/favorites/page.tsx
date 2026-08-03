import type { Metadata } from "next";

import { Favorites } from "./Favorites";

export const metadata: Metadata = {
  title: "Избранное",
};

export default function FavoritesPage() {
  return <Favorites />;
}
