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
  images: string[];
  categoryId?: string | null;
  category?: ICategory | null;
}

export interface IProductInput
  extends Pick<
    IProduct,
    "title" | "description" | "price" | "images"
  > {
  categoryId: string;
}
