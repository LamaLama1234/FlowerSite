import Link from "next/link";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";

import { GoldDivider } from "@/components/decorative/GoldDivider";
import { SparkleField } from "@/components/decorative/SparkleField";

export function Footer() {
  return (
    <footer className="bg-celestial-pattern bg-background relative overflow-hidden border-t border-gold-200/40">
      <SparkleField count={4} />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-14 pb-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="ring-gold-300/40 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-1">
                <Leaf className="size-5" />
              </span>
              <span className="font-heading text-xl tracking-wide text-primary">
                GreenArt
              </span>
            </Link>
            <p className="text-muted-foreground mt-4 max-w-xs text-sm text-pretty">
              Цветочный бутик для тех, кто ценит красоту в деталях —
              авторские букеты, растения и декор ручной работы.
            </p>
          </div>

          <div>
            <h3 className="font-heading mb-4 text-sm tracking-wide text-primary uppercase">
              Навигация
            </h3>
            <ul className="text-muted-foreground flex flex-col gap-2.5 text-sm">
              <li>
                <Link href="/catalog" className="hover:text-primary transition-colors">
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-primary transition-colors">
                  Корзина
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading mb-4 text-sm tracking-wide text-primary uppercase">
              Контакты
            </h3>
            <ul className="text-muted-foreground flex flex-col gap-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="text-gold-500 size-4 shrink-0" />
                +7 (900) 000-00-00
              </li>
              <li className="flex items-center gap-2">
                <Mail className="text-gold-500 size-4 shrink-0" />
                hello@greenart.flowers
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="text-gold-500 size-4 shrink-0" />
                Москва, ул. Цветочная, 1
              </li>
            </ul>
          </div>
        </div>

        <GoldDivider variant="diamond" className="py-8" />

        <p className="text-muted-foreground text-center text-xs">
          © {new Date().getFullYear()} GreenArt. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
