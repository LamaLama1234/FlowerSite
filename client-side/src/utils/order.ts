import { EnumOrderStatus } from "@/shared/types/order.interface";

interface StatusMeta {
  label: string;
  className: string;
}

const ORDER_STATUS_META: Record<EnumOrderStatus, StatusMeta> = {
  [EnumOrderStatus.PENDING]: {
    label: "В ожидании",
    className: "bg-muted text-muted-foreground",
  },
  [EnumOrderStatus.AWAITING_PAYMENT]: {
    label: "Ждёт оплаты",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  [EnumOrderStatus.CONFIRMED]: {
    label: "Подтверждён",
    className: "bg-primary/10 text-primary",
  },
  [EnumOrderStatus.IN_PROGRESS]: {
    label: "Собирается",
    className: "bg-primary/10 text-primary",
  },
  [EnumOrderStatus.IN_DELIVERY]: {
    label: "В доставке",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  [EnumOrderStatus.COMPLETED]: {
    label: "Выполнен",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  [EnumOrderStatus.CANCELLED]: {
    label: "Отменён",
    className: "bg-destructive/10 text-destructive",
  },
};

export function getOrderStatusMeta(status: EnumOrderStatus): StatusMeta {
  return (
    ORDER_STATUS_META[status] ?? {
      label: status,
      className: "bg-muted text-muted-foreground",
    }
  );
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatOrderDate(date: string) {
  return dateFormatter.format(new Date(date));
}

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatOrderDateTime(date: string) {
  return dateTimeFormatter.format(new Date(date));
}

const STATUS_SOURCE_LABEL: Record<string, string> = {
  customer: "Покупатель",
  admin: "Админ",
  worker: "Сотрудник",
  telegram: "Telegram-бот",
  yookassa: "ЮKassa",
  system: "Система",
};

export function getStatusSourceLabel(source: string) {
  return STATUS_SOURCE_LABEL[source] ?? source;
}
