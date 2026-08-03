import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { productService, type IProductsQuery } from "@/services/product.service";

export function useProducts(query: IProductsQuery = {}) {
  const {
    searchTerm = "",
    categoryId = "",
    page = 1,
    limit = 100,
    minPrice,
    maxPrice,
    sortBy = "newest",
  } = query;

  return useQuery({
    queryKey: [
      "products",
      searchTerm,
      categoryId,
      page,
      limit,
      minPrice ?? "",
      maxPrice ?? "",
      sortBy,
    ],
    queryFn: () =>
      productService.getAll({
        searchTerm,
        categoryId,
        page,
        limit,
        minPrice,
        maxPrice,
        sortBy,
      }),
    placeholderData: keepPreviousData,
  });
}
