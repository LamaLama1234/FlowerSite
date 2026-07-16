import { IProduct } from './product.interface';
import { IUser } from './user.interface';

// Соответствует EnumOrderStatus в Prisma-схеме (server-side) — раньше тут
// был выдуманный набор значений, никогда не совпадавший с реальным.
export enum EnumOrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    IN_DELIVERY = 'IN_DELIVERY',
    IN_PROGRESS = 'IN_PROGRESS',
    AWAITING_PAYMENT = 'AWAITING_PAYMENT'
}

export enum EnumDeliveryType {
    PICKUP = 'PICKUP',
    COURIER = 'COURIER'
}

export interface IOrderItem {
    id: string;
    createdAt: string;
    updatedAt: string;
    quantity: number;
    price: number;
    product: IProduct;
}

export interface IOrder {
    id: string;
    createdAt: string;
    updatedAt: string;
    status: EnumOrderStatus;
    items: IOrderItem[];
    total: number;
    customerName: string;
    phone: string;
    deliveryType: EnumDeliveryType;
    deliveryAddress: string;
    deliveryDate: string;
    comment?: string | null;
    shippingPrice: number;
    paymentLink?: string | null;
    user?: IUser;
}

export interface IOrderItemInput {
    productId: string;
    quantity: number;
}

export interface IOrderInput {
    customerName: string;
    phone: string;
    deliveryType: EnumDeliveryType;
    deliveryAddress: string;
    deliveryDate: string;
    comment?: string;
    items: IOrderItemInput[];
}