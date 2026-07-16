import { axiosClassic, axiosWithAuth } from "@/api/axios";
import { getProductsUrl } from "@/constants/api.constants";
import type { IProduct, IProductInput } from "@/shared/types/product.interface";
import type { IPaginatedResponse } from "@/shared/types/pagination.interface";

export const productService = {
  async getAll(searchTerm?: string, categoryId?: string) {
    // limit: 100 — максимум, который отдаёт бэкенд за один запрос. В каталоге
    // пока нет UI пагинации/подгрузки, поэтому забираем целиком одну "страницу".
    const { data } = await axiosClassic.get<IPaginatedResponse<IProduct>>(
      getProductsUrl(),
      {
        params: {
          limit: 100,
          ...(searchTerm ? { searchTerm } : {}),
          ...(categoryId ? { categoryId } : {}),
        },
      },
    );
    return data;
  },

  async getById(id: string) {
    const { data } = await axiosClassic.get<IProduct>(
      getProductsUrl(`/by-id/${id}`),
    );
    return data;
  },

  async getByCategory(categoryId: string) {
    const { data } = await axiosClassic.get<IProduct[]>(
      getProductsUrl(`/by-category/${categoryId}`),
    );
    return data;
  },

  async getMostPopular() {
    const { data } = await axiosClassic.get<IProduct[]>(
      getProductsUrl("/most-popular"),
    );
    return data;
  },

  // Admin-only — требуют роль ADMIN на бэкенде.
  async create(dto: IProductInput) {
    const { data } = await axiosWithAuth.post<IProduct>(getProductsUrl(), dto);
    return data;
  },

  async update(id: string, dto: IProductInput) {
    const { data } = await axiosWithAuth.put<IProduct>(
      getProductsUrl(`/${id}`),
      dto,
    );
    return data;
  },

  async delete(id: string) {
    const { data } = await axiosWithAuth.delete(getProductsUrl(`/${id}`));
    return data;
  },
};
