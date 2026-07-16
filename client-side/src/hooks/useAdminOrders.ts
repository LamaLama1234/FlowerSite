import { useQuery } from "@tanstack/react-query";

import { orderService } from "@/services/order.service";

/** Список всех заказов для ADMIN/WORKER — отдельно от useOrders() (свои заказы). */
export function useAdminOrders() {
  return useQuery({
    queryKey: ["orders", "admin-all"],
    queryFn: () => orderService.getAll(),
  });
}
