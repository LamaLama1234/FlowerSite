import { API_URL } from "@/constants/api.constants";

/** Цена из БД хранится целым числом — форматируем в рубли. */
export function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(price);
}

/** Картинки могут приходить относительным путём — дополняем адресом бэкенда. */
export function resolveImageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
