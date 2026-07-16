import type { ICategory } from "@/shared/types/category.interface";

export function findCategoryByTitle(
  categories: ICategory[] | undefined,
  title: string,
) {
  return categories?.find((category) => category.title === title);
}
