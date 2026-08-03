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

export interface IOrderStatusHistoryEntry {
    id: string;
    createdAt: string;
    status: EnumOrderStatus;
    source: string;
    changedByUser?: { name: string; role: string } | null;
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
    isAsap: boolean;
    deliveryTimeSlot?: string | null;
    comment?: string | null;
    shippingPrice: number;
    paymentLink?: string | null;
    promoCode?: string | null;
    discount: number;
    user?: IUser;
    /** Приходит только из getById — полный лог смены статусов, для админки. */
    statusHistory?: IOrderStatusHistoryEntry[];
}

/** Урезанные данные заказа для воркеров — см. getForWorker на бэкенде. */
export interface IWorkerOrder {
    id: string;
    createdAt: string;
    status: EnumOrderStatus;
    customerName: string;
    phone: string;
    deliveryType: EnumDeliveryType;
    deliveryAddress: string;
    deliveryDate: string;
    isAsap: boolean;
    deliveryTimeSlot?: string | null;
    comment?: string | null;
    total: number;
    items: {
        id: string;
        quantity: number;
        price: number;
        product: { title: string };
    }[];
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
    isAsap?: boolean;
    deliveryTimeSlot?: string;
    comment?: string;
    promoCode?: string;
    items: IOrderItemInput[];
}

export interface IPromoValidation {
    valid: boolean;
    discountPercent?: number;
    message?: string;
}

export interface IOrderAnalytics {
    summary: {
        totalRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
    };
    revenueByDay: { date: string; revenue: number }[];
    ordersByStatus: { status: EnumOrderStatus; count: number }[];
    topProducts: {
        productId: string;
        title: string;
        quantity: number;
        revenue: number;
    }[];
}