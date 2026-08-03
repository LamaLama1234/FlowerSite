import { axiosWithAuth } from "@/api/axios";
import { getOrdersUrl } from "@/constants/api.constants";
import type {
  EnumOrderStatus,
  IOrder,
  IOrderAnalytics,
  IOrderInput,
  IPromoValidation,
  IWorkerOrder,
} from "@/shared/types/order.interface";
import type { IPaginatedResponse } from "@/shared/types/pagination.interface";

export const orderService = {
  async getByUser() {
    const { data } = await axiosWithAuth.get<IOrder[]>(
      getOrdersUrl("/by-user"),
    );
    return data;
  },

  async create(dto: IOrderInput) {
    const { data } = await axiosWithAuth.post<IOrder>(getOrdersUrl(), dto);
    return data;
  },

  async getById(id: string) {
    const { data } = await axiosWithAuth.get<IOrder>(
      getOrdersUrl(`/by-id/${id}`),
    );
    return data;
  },

  async validatePromoCode(promoCode: string, phone: string) {
    const { data } = await axiosWithAuth.post<IPromoValidation>(
      getOrdersUrl("/validate-promo"),
      { promoCode, phone },
    );
    return data;
  },

  // Admin/worker-only — требуют роль ADMIN или WORKER на бэкенде.
  async getAll() {
    const { data } = await axiosWithAuth.get<IPaginatedResponse<IOrder>>(
      getOrdersUrl(),
      { params: { limit: 100 } },
    );
    return data;
  },

  async getForWorker() {
    const { data } = await axiosWithAuth.get<IWorkerOrder[]>(
      getOrdersUrl("/worker-view"),
    );
    return data;
  },

  async getAnalytics() {
    const { data } = await axiosWithAuth.get<IOrderAnalytics>(
      getOrdersUrl("/analytics"),
    );
    return data;
  },

  async updateStatus(id: string, status: EnumOrderStatus) {
    const { data } = await axiosWithAuth.patch<IOrder>(
      getOrdersUrl(`/${id}/status`),
      { status },
    );
    return data;
  },
};
