import { useQuery } from "@tanstack/react-query";

import { productService } from "@/services/product.service";

export function useRelatedProducts(id: string) {
  return useQuery({
    queryKey: ["products", "related", id],
    queryFn: () => productService.getRelated(id),
  });
}
