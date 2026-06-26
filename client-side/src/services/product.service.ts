import { axiosClassic } from "@/api/axios";
import { getProductsUrl } from "@/constants/api.constants";
import type { IProduct } from "@/shared/types/product.interface";

export const productService = {
  async getAll(searchTerm?: string) {
    const { data } = await axiosClassic.get<IProduct[]>(getProductsUrl(), {
      params: searchTerm ? { searchTerm } : {},
    });
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
};
