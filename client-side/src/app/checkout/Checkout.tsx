"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Tag, Zap } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  useCartHasHydrated,
  useCartStore,
  useCartTotal,
} from "@/stores/cart.store";
import { orderService } from "@/services/order.service";
import { EnumDeliveryType } from "@/shared/types/order.interface";
import { formatPrice } from "@/utils/product";
import { extractErrorMessage } from "@/utils/errors";
import { CornerFlourish } from "@/components/decorative/CornerFlourish";
import { GoldDivider } from "@/components/decorative/GoldDivider";

// Бэкенд требует непустой deliveryAddress независимо от способа получения —
// при самовывозе поле скрыто в форме, но серверу всё равно нужно что-то
// отправить, поэтому используем понятную заглушку.
const PICKUP_ADDRESS_PLACEHOLDER = "Самовывоз из магазина";

interface FormState {
  customerName: string;
  phone: string;
  deliveryType: EnumDeliveryType;
  deliveryAddress: string;
  deliveryDate: string;
  isAsap: boolean;
  deliveryTimeSlot: string;
  comment: string;
}

const EMPTY_FORM: FormState = {
  customerName: "",
  phone: "",
  deliveryType: EnumDeliveryType.COURIER,
  deliveryAddress: "",
  deliveryDate: "",
  isAsap: false,
  deliveryTimeSlot: "",
  comment: "",
};

const DELIVERY_OPTIONS = [
  { value: EnumDeliveryType.COURIER, label: "Курьером" },
  { value: EnumDeliveryType.PICKUP, label: "Самовывоз" },
] as const;

const TIME_SLOTS = ["09:00–12:00", "12:00–15:00", "15:00–18:00", "18:00–21:00"];

const timeOptionClass = (active: boolean) =>
  `rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
    active
      ? "ring-gold-300/50 border-primary bg-primary/10 text-primary ring-1"
      : "border-gold-200/50 text-muted-foreground hover:text-foreground"
  }`;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function Checkout() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const total = useCartTotal();
  const hasHydrated = useCartHasHydrated();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);

  // Ставится перед clearCart() при успешном заказе — иначе обнуление
  // корзины сразу же триггерит редирект на /cart ниже, обгоняя переход
  // на /dashboard из onSuccess.
  const orderSubmittedRef = useRef(false);

  // Ждём гидратацию корзины из localStorage, прежде чем решать, что она
  // пуста — иначе на каждой жёсткой перезагрузке будет ложный редирект.
  useEffect(() => {
    if (hasHydrated && items.length === 0 && !orderSubmittedRef.current) {
      router.replace("/cart");
    }
  }, [hasHydrated, items.length, router]);

  const discount = appliedPromo
    ? Math.round((total * appliedPromo.discountPercent) / 100)
    : 0;
  const finalTotal = total - discount;

  const validatePromoMutation = useMutation({
    mutationFn: () =>
      orderService.validatePromoCode(promoInput.trim(), form.phone),
    onSuccess(data) {
      if (data.valid && data.discountPercent) {
        setAppliedPromo({
          code: promoInput.trim().toUpperCase(),
          discountPercent: data.discountPercent,
        });
        toast.success(`Промокод применён: −${data.discountPercent}%`);
      } else {
        setAppliedPromo(null);
        toast.error(data.message ?? "Промокод недействителен");
      }
    },
    onError(error) {
      setAppliedPromo(null);
      toast.error(extractErrorMessage(error));
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      orderService.create({
        customerName: form.customerName,
        phone: form.phone,
        deliveryType: form.deliveryType,
        deliveryAddress:
          form.deliveryType === EnumDeliveryType.PICKUP
            ? PICKUP_ADDRESS_PLACEHOLDER
            : form.deliveryAddress,
        deliveryDate: form.deliveryDate,
        isAsap: form.isAsap,
        deliveryTimeSlot: form.isAsap ? undefined : form.deliveryTimeSlot,
        comment: form.comment || undefined,
        promoCode: appliedPromo?.code,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      }),
    onSuccess() {
      orderSubmittedRef.current = true;
      clearCart();
      toast.success("Заказ оформлен!");
      router.push("/dashboard");
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Промокод проверялся вместе с конкретным номером телефона — при его
    // смене старая проверка больше не действительна.
    if (field === "phone" && appliedPromo) {
      setAppliedPromo(null);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    mutate();
  }

  if (!hasHydrated || items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-heading mb-8 text-3xl text-primary">
        Оформление заказа
      </h1>

      <div className="glass-panel relative mb-8 flex flex-col gap-3 rounded-2xl p-5">
        <CornerFlourish corner="tr" />
        <h2 className="text-muted-foreground text-sm font-medium">
          Ваш заказ
        </h2>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate">
                {item.product.title} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-gold-200/50 flex flex-col gap-1.5 border-t pt-3">
          {appliedPromo && (
            <div className="text-primary flex items-center justify-between text-sm font-medium">
              <span>Скидка по промокоду {appliedPromo.code}</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Итого</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel relative mb-8 flex flex-col gap-2 rounded-2xl p-5 sm:flex-row sm:items-end">
        <Field label="Промокод">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="WELCOME10"
            disabled={Boolean(appliedPromo)}
            className={inputClass}
          />
        </Field>
        {appliedPromo ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAppliedPromo(null);
              setPromoInput("");
            }}
          >
            Убрать
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={!promoInput.trim() || validatePromoMutation.isPending}
            onClick={() => validatePromoMutation.mutate()}
          >
            <Tag className="size-4" />
            {validatePromoMutation.isPending ? "Проверяем…" : "Применить"}
          </Button>
        )}
      </div>

      <GoldDivider variant="diamond" className="mb-8" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Ваше имя">
          <input
            type="text"
            required
            maxLength={100}
            value={form.customerName}
            onChange={(e) => updateField("customerName", e.target.value)}
            placeholder="Как к вам обращаться"
            autoComplete="name"
            className={inputClass}
          />
        </Field>

        <Field label="Телефон">
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+7 900 000-00-00"
            autoComplete="tel"
            className={inputClass}
          />
        </Field>

        <Field label="Способ получения">
          <div className="grid grid-cols-2 gap-2">
            {DELIVERY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField("deliveryType", option.value)}
                className={`rounded-lg border py-2.5 text-sm font-medium transition-all ${
                  form.deliveryType === option.value
                    ? "ring-gold-300/50 border-primary bg-primary/10 text-primary ring-1"
                    : "border-gold-200/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        {form.deliveryType === EnumDeliveryType.COURIER && (
          <Field label="Адрес доставки">
            <input
              type="text"
              required
              value={form.deliveryAddress}
              onChange={(e) => updateField("deliveryAddress", e.target.value)}
              placeholder="Улица, дом, квартира"
              autoComplete="street-address"
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Дата доставки">
          <input
            type="date"
            required
            min={today()}
            value={form.deliveryDate}
            onChange={(e) => updateField("deliveryDate", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Время доставки">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                updateField("isAsap", true);
                updateField("deliveryTimeSlot", "");
              }}
              className={timeOptionClass(form.isAsap)}
            >
              <span className="inline-flex items-center gap-1.5">
                <Zap className="size-3.5" />
                Как можно быстрее
              </span>
            </button>
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  updateField("isAsap", false);
                  updateField("deliveryTimeSlot", slot);
                }}
                className={timeOptionClass(
                  !form.isAsap && form.deliveryTimeSlot === slot,
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Комментарий (необязательно)">
          <textarea
            value={form.comment}
            onChange={(e) => updateField("comment", e.target.value)}
            placeholder="Пожелания к заказу"
            rows={3}
            maxLength={500}
            className={inputClass}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          disabled={isPending || (!form.isAsap && !form.deliveryTimeSlot)}
          className="mt-2 h-11"
        >
          {isPending
            ? "Оформляем…"
            : `Оформить заказ на ${formatPrice(finalTotal)}`}
        </Button>
      </form>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-gold-200/50 bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-foreground text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
