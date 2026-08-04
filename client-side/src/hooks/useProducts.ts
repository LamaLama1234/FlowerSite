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
    discounted = false,
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
      discounted,
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
        discounted,
      }),
    placeholderData: keepPreviousData,
  });
}
