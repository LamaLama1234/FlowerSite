import { useQuery } from "@tanstack/react-query";

import { productService } from "@/services/product.service";

export function useCategoryChampions() {
  return useQuery({
    queryKey: ["products", "category-champions"],
    queryFn: () => productService.getCategoryChampions(),
  });
}
