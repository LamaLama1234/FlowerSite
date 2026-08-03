import { useQuery } from "@tanstack/react-query";

import { orderService } from "@/services/order.service";

export function useOrderAnalytics() {
  return useQuery({
    queryKey: ["orders", "analytics"],
    queryFn: () => orderService.getAnalytics(),
  });
}
