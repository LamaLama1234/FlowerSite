import { useQuery } from "@tanstack/react-query";

import { getAccessToken } from "@/services/auth-token.service";
import { orderService } from "@/services/order.service";

export function useOrders(hasAccessToken?: boolean) {
  return useQuery({
    queryKey: ["orders", "by-user"],
    queryFn: () => orderService.getByUser(),
    // hasAccessToken передаётся с сервера (next/headers), чтобы enabled
    // совпадал на SSR и на клиенте — та же схема, что и в useProfile.
    enabled: hasAccessToken ?? Boolean(getAccessToken()),
    retry: false,
  });
}
