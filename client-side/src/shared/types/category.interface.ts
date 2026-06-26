// Соответствует модели Category в Prisma (server-side).
export interface ICategory {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
}

export type ICategoryInput = Pick<ICategory, "title" | "description">;
