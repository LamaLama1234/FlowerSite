"use client";

import { memo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import toast from "react-hot-toast";

import { useProfile } from "@/hooks/useProfile";
import { useWorkerOrders } from "@/hooks/useWorkerOrders";
import { orderService } from "@/services/order.service";
import {
  EnumDeliveryType,
  EnumOrderStatus,
  type IWorkerOrder,
} from "@/shared/types/order.interface";
import { formatPrice } from "@/utils/product";
import { formatOrderDateTime, getOrderStatusMeta } from "@/utils/order";
import { extractErrorMessage } from "@/utils/errors";
import { GoldDivider } from "@/components/decorative/GoldDivider";

interface WorkerProps {
  hasAccessToken: boolean;
}

const STATUS_OPTIONS = Object.values(EnumOrderStatus);

const DELIVERY_TYPE_LABEL: Record<EnumDeliveryType, string> = {
  [EnumDeliveryType.COURIER]: "Курьером",
  [EnumDeliveryType.PICKUP]: "Самовывоз",
};

export function Worker({ hasAccessToken }: WorkerProps) {
  const router = useRouter();
  const { data: user, isLoading } = useProfile(hasAccessToken);
  const { data: orders, isLoading: isOrdersLoading } = useWorkerOrders();
  const queryClient = useQueryClient();

  const isAllowed = user?.role === "ADMIN" || user?.role === "WORKER";

  useEffect(() => {
    if (!isLoading && !isAllowed) {
      router.replace("/");
    }
  }, [isLoading, isAllowed, router]);

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { id: string; status: EnumOrderStatus }) =>
      orderService.updateStatus(vars.id, vars.status),
    onSuccess() {
      toast.success("Статус обновлён");
      queryClient.invalidateQueries({ queryKey: ["orders", "worker-view"] });
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const { mutate: updateStatus } = updateStatusMutation;
  const handleStatusChange = useCallback(
    (id: string, status: EnumOrderStatus) => {
      updateStatus({ id, status });
    },
    [updateStatus],
  );

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Загружаем…</p>
      </main>
    );
  }

  if (!isAllowed) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Доступ запрещён</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-heading mb-1 text-3xl text-primary">
        Кабинет сотрудника
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Активные заказы — только то, что нужно для сборки и доставки
      </p>

      <GoldDivider variant="diamond" className="mb-8" />

      {isOrdersLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : !orders?.length ? (
        <div className="border-gold-200/60 rounded-2xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">Активных заказов нет</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <WorkerOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

// memo — карточка не должна перерисовываться при обновлении статуса
// соседних заказов: order стабилен между рендерами (React Query),
// onStatusChange теперь принимает id и завязан на useCallback в Worker,
// а не создаётся заново на каждую карточку при каждом рендере списка.
const WorkerOrderCard = memo(function WorkerOrderCard({
  order,
  onStatusChange,
}: {
  order: IWorkerOrder;
  onStatusChange: (id: string, status: EnumOrderStatus) => void;
}) {
  const meta = getOrderStatusMeta(order.status);

  return (
    <li className="border-gold-200/50 border-l-gold-400 rounded-2xl border border-l-4 bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg text-primary">
            №{order.id.slice(-6)}
          </h2>
          <p className="text-muted-foreground text-xs">
            {formatOrderDateTime(order.createdAt)}
          </p>
        </div>
        <select
          value={order.status}
          onChange={(e) =>
            onStatusChange(order.id, e.target.value as EnumOrderStatus)
          }
          className={`rounded-full border-0 px-3 py-1 text-xs font-medium outline-none ${meta.className}`}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {getOrderStatusMeta(status).label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div>
          <span className="text-muted-foreground block text-xs">
            Покупатель
          </span>
          <span className="font-medium">{order.customerName}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">Телефон</span>
          <a
            href={`tel:${order.phone}`}
            className="text-primary flex items-center gap-1 font-medium hover:underline"
          >
            <Phone className="size-3.5" />
            {order.phone}
          </a>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">
            Получение
          </span>
          <span className="font-medium">
            {DELIVERY_TYPE_LABEL[order.deliveryType]}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">Время</span>
          <span className="font-medium">
            {order.isAsap ? "Как можно быстрее" : order.deliveryTimeSlot || "—"}
          </span>
        </div>
        {order.deliveryType === EnumDeliveryType.COURIER && (
          <div>
            <span className="text-muted-foreground block text-xs">Адрес</span>
            <span className="font-medium">{order.deliveryAddress}</span>
          </div>
        )}
      </div>

      <ul className="border-gold-100/60 mb-2 flex flex-col gap-1 border-t pt-2 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between">
            <span className="truncate">
              {item.product.title} × {item.quantity}
            </span>
            <span className="text-muted-foreground">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {order.comment && (
        <p className="text-muted-foreground mb-2 text-sm italic">
          «{order.comment}»
        </p>
      )}

      <div className="border-gold-100/60 flex items-center justify-between border-t pt-2 text-sm font-semibold">
        <span>Итого</span>
        <span>{formatPrice(order.total)}</span>
      </div>
    </li>
  );
});
