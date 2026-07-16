import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { productService } from "@/services/product.service";

export function useProducts(searchTerm?: string, categoryId?: string) {
  return useQuery({
    queryKey: ["products", searchTerm ?? "", categoryId ?? ""],
    queryFn: () => productService.getAll(searchTerm, categoryId),
    placeholderData: keepPreviousData,
  });
}
