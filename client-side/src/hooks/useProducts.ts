import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { productService } from "@/services/product.service";

export function useProducts(searchTerm?: string) {
  return useQuery({
    queryKey: ["products", searchTerm ?? ""],
    queryFn: () => productService.getAll(searchTerm),
    placeholderData: keepPreviousData,
  });
}
