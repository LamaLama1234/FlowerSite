import { axiosClassic, axiosWithAuth } from "@/api/axios";
import { getProductsUrl } from "@/constants/api.constants";
import type {
  IProduct,
  IProductInput,
  ProductSortBy,
} from "@/shared/types/product.interface";
import type { IPaginatedResponse } from "@/shared/types/pagination.interface";

export interface IProductsQuery {
  searchTerm?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortBy;
}

export const productService = {
  async getAll(query: IProductsQuery = {}) {
    const { data } = await axiosClassic.get<IPaginatedResponse<IProduct>>(
      getProductsUrl(),
      {
        params: {
          page: query.page,
          limit: query.limit ?? 100,
          searchTerm: query.searchTerm || undefined,
          categoryId: query.categoryId || undefined,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          sortBy: query.sortBy,
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

  async getDiscounted() {
    const { data } = await axiosClassic.get<IProduct[]>(
      getProductsUrl("/discounted"),
    );
    return data;
  },

  async getRelated(id: string) {
    const { data } = await axiosClassic.get<IProduct[]>(
      getProductsUrl(`/related/${id}`),
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
