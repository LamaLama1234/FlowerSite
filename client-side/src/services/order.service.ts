import { axiosWithAuth } from "@/api/axios";
import { getOrdersUrl } from "@/constants/api.constants";
import type {
  EnumOrderStatus,
  IOrder,
  IOrderInput,
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

  // Admin/worker-only — требуют роль ADMIN или WORKER на бэкенде.
  async getAll() {
    const { data } = await axiosWithAuth.get<IPaginatedResponse<IOrder>>(
      getOrdersUrl(),
      { params: { limit: 100 } },
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
