import { axiosClassic, axiosWithAuth } from "@/api/axios";
import { getCategoriesUrl } from "@/constants/api.constants";
import type {
  ICategory,
  ICategoryInput,
} from "@/shared/types/category.interface";

export const categoryService = {
  async getAll() {
    const { data } = await axiosClassic.get<ICategory[]>(getCategoriesUrl());
    return data;
  },

  // Admin-only — требуют роль ADMIN на бэкенде.
  async create(dto: ICategoryInput) {
    const { data } = await axiosWithAuth.post<ICategory>(
      getCategoriesUrl(),
      dto,
    );
    return data;
  },

  async update(id: string, dto: ICategoryInput) {
    const { data } = await axiosWithAuth.put<ICategory>(
      getCategoriesUrl(`/${id}`),
      dto,
    );
    return data;
  },

  async delete(id: string) {
    const { data } = await axiosWithAuth.delete(getCategoriesUrl(`/${id}`));
    return data;
  },
};
