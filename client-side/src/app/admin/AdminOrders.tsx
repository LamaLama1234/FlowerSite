"use client";

import { memo, useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, History, Info } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { useOrderDetail } from "@/hooks/useOrderDetail";
import { orderService } from "@/services/order.service";
import {
  EnumDeliveryType,
  EnumOrderStatus,
  type IOrder,
} from "@/shared/types/order.interface";
import { formatPrice } from "@/utils/product";
import {
  formatOrderDate,
  formatOrderDateTime,
  getOrderStatusMeta,
  getStatusSourceLabel,
} from "@/utils/order";
import { extractErrorMessage } from "@/utils/errors";

const STATUS_OPTIONS = Object.values(EnumOrderStatus);

const DELIVERY_TYPE_LABEL: Record<EnumDeliveryType, string> = {
  [EnumDeliveryType.COURIER]: "Курьером",
  [EnumDeliveryType.PICKUP]: "Самовывоз",
};

export function AdminOrders() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminOrders();
  const orders = data?.items;
  const [detailId, setDetailId] = useState<string | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { id: string; status: EnumOrderStatus }) =>
      orderService.updateStatus(vars.id, vars.status),
    onSuccess() {
      toast.success("Статус обновлён");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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

  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <table className="w-full text-sm">
        <thead className="border-gold-200/50 text-muted-foreground border-b text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Заказ</th>
            <th className="px-4 py-3 font-medium">Покупатель</th>
            <th className="px-4 py-3 font-medium">Дата</th>
            <th className="px-4 py-3 font-medium">Итог</th>
            <th className="px-4 py-3 font-medium">Статус</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td className="text-muted-foreground px-4 py-6" colSpan={6}>
                Загрузка…
              </td>
            </tr>
          ) : !orders?.length ? (
            <tr>
              <td className="text-muted-foreground px-4 py-6" colSpan={6}>
                Заказов пока нет
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onOpenDetail={setDetailId}
              />
            ))
          )}
        </tbody>
      </table>

      <OrderDetailDialog
        orderId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

// memo — строки таблицы не должны перерисовываться при каждом открытии
// диалога деталей (смена detailId): order приходит из React Query
// (стабильная ссылка), а onStatusChange/onOpenDetail — стабильные колбэки
// (useCallback поверх mutate и сеттер стейта соответственно).
const OrderRow = memo(function OrderRow({
  order,
  onStatusChange,
  onOpenDetail,
}: {
  order: IOrder;
  onStatusChange: (id: string, status: EnumOrderStatus) => void;
  onOpenDetail: (id: string) => void;
}) {
  const meta = getOrderStatusMeta(order.status);
  return (
    <tr className="border-gold-100/60 border-b last:border-0">
      <td className="px-4 py-3 font-medium">№{order.id.slice(-6)}</td>
      <td className="px-4 py-3">{order.customerName}</td>
      <td className="text-muted-foreground px-4 py-3">
        {formatOrderDate(order.createdAt)}
      </td>
      <td className="px-4 py-3">{formatPrice(order.total)}</td>
      <td className="px-4 py-3">
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
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onOpenDetail(order.id)}
          aria-label={`Подробнее о заказе №${order.id.slice(-6)}`}
        >
          <Info className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
});

function OrderDetailDialog({
  orderId,
  onClose,
}: {
  orderId: string | null;
  onClose: () => void;
}) {
  const { data: order, isLoading } = useOrderDetail(orderId);

  return (
    <Dialog open={Boolean(orderId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {order ? `Заказ №${order.id.slice(-6)}` : "Заказ"}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !order ? (
          <p className="text-muted-foreground text-sm">Загрузка…</p>
        ) : (
          <div className="flex flex-col gap-5 text-sm">
            <section className="grid grid-cols-2 gap-x-4 gap-y-2">
              <InfoRow label="Покупатель" value={order.customerName} />
              <InfoRow label="Телефон" value={order.phone} />
              <InfoRow
                label="Получение"
                value={DELIVERY_TYPE_LABEL[order.deliveryType]}
              />
              <InfoRow
                label="Дата доставки"
                value={formatOrderDate(order.deliveryDate)}
              />
              <InfoRow
                label="Время"
                value={order.isAsap ? "Как можно быстрее" : order.deliveryTimeSlot || "—"}
              />
              {order.deliveryType === EnumDeliveryType.COURIER && (
                <InfoRow
                  label="Адрес"
                  value={order.deliveryAddress}
                  span
                />
              )}
              {order.comment && (
                <InfoRow label="Комментарий" value={order.comment} span />
              )}
              {order.paymentLink && (
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">
                    Ссылка на оплату
                  </span>
                  <a
                    href={order.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    Открыть <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </section>

            <section>
              <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                Состав заказа
              </h3>
              <ul className="border-gold-200/50 divide-gold-100/60 rounded-lg border divide-y">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span className="truncate">
                      {item.product.title} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-col gap-1 text-right">
                {order.discount > 0 && (
                  <span className="text-muted-foreground text-xs">
                    Скидка{order.promoCode ? ` (${order.promoCode})` : ""}: −
                    {formatPrice(order.discount)}
                  </span>
                )}
                {order.shippingPrice > 0 && (
                  <span className="text-muted-foreground text-xs">
                    Доставка: {formatPrice(order.shippingPrice)}
                  </span>
                )}
                <span className="text-base font-semibold">
                  Итого: {formatPrice(order.total)}
                </span>
              </div>
            </section>

            {order.statusHistory && order.statusHistory.length > 0 && (
              <section>
                <h3 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                  <History className="size-3.5" />
                  Лог статусов
                </h3>
                <ul className="flex flex-col gap-2">
                  {order.statusHistory.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${getOrderStatusMeta(entry.status).className}`}
                        >
                          {getOrderStatusMeta(entry.status).label}
                        </span>
                        <span className="text-muted-foreground">
                          {entry.changedByUser?.name ??
                            getStatusSourceLabel(entry.source)}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        {formatOrderDateTime(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  label,
  value,
  span,
}: {
  label: string;
  value: string;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2" : undefined}>
      <span className="text-muted-foreground block text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
