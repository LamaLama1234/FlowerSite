import { useQuery } from "@tanstack/react-query";

import { orderService } from "@/services/order.service";

/** Полная карточка заказа (с логом статусов) — для детального просмотра в админке. */
export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => orderService.getById(id as string),
    enabled: Boolean(id),
  });
}
