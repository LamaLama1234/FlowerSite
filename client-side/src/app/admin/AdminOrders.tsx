"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useAdminOrders } from "@/hooks/useAdminOrders";
import { orderService } from "@/services/order.service";
import { EnumOrderStatus } from "@/shared/types/order.interface";
import { formatPrice } from "@/utils/product";
import { formatOrderDate, getOrderStatusMeta } from "@/utils/order";
import { extractErrorMessage } from "@/utils/errors";

const STATUS_OPTIONS = Object.values(EnumOrderStatus);

export function AdminOrders() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminOrders();
  const orders = data?.items;

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
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td className="text-muted-foreground px-4 py-6" colSpan={5}>
                Загрузка…
              </td>
            </tr>
          ) : !orders?.length ? (
            <tr>
              <td className="text-muted-foreground px-4 py-6" colSpan={5}>
                Заказов пока нет
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const meta = getOrderStatusMeta(order.status);
              return (
                <tr
                  key={order.id}
                  className="border-gold-100/60 border-b last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    №{order.id.slice(-6)}
                  </td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="text-muted-foreground px-4 py-3">
                    {formatOrderDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: order.id,
                          status: e.target.value as EnumOrderStatus,
                        })
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
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
