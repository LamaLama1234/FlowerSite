import { ICategory } from "./category.interface";

// Соответствует модели Product в Prisma (server-side):
// images — массив URL, category опциональна, price хранится как целое.
export interface IProduct {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  images: string[];
  tags: string[];
  categoryId?: string | null;
  category?: ICategory | null;
}

export interface IProductInput
  extends Pick<
    IProduct,
    "title" | "description" | "price" | "oldPrice" | "images" | "tags"
  > {
  categoryId: string;
}

export type ProductSortBy = "newest" | "price_asc" | "price_desc";
