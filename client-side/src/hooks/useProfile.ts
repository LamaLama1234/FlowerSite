import { useQuery } from "@tanstack/react-query";

import { getAccessToken } from "@/services/auth-token.service";
import { userService } from "@/services/user.service";

export function useProfile(hasAccessToken?: boolean) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => userService.getProfile(),
    // Без токена профиль не запрашиваем — иначе на публичных страницах летят 401.
    // hasAccessToken можно передать с сервера (next/headers), чтобы значение
    // enabled совпадало на SSR и на клиенте — иначе js-cookie на сервере
    // всегда возвращает null и ловим hydration mismatch.
    enabled: hasAccessToken ?? Boolean(getAccessToken()),
    retry: false,
  });
}
