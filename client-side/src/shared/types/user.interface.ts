import { IOrder } from "./order.interface";

// role соответствует EnumUserRole в Prisma-схеме (server-side) — раньше
// здесь были строчные "user"/"admin", из-за чего сравнения с реальным
// значением роли всегда были false.
export interface IUser {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN" | "WORKER";
    orders: IOrder[];
}