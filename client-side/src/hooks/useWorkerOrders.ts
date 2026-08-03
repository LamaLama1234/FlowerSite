import { useQuery } from "@tanstack/react-query";

import { orderService } from "@/services/order.service";

/** Урезанный список заказов для воркеров — без email/платежей/лога клиента. */
export function useWorkerOrders() {
  return useQuery({
    queryKey: ["orders", "worker-view"],
    queryFn: () => orderService.getForWorker(),
  });
}
