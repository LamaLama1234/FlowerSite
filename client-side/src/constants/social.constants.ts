import type { IconType } from "react-icons";
import { FaInstagram, FaMapLocationDot, FaTelegram, FaWhatsapp } from "react-icons/fa6";

export interface ISocialLink {
  label: string;
  description: string;
  href: string;
  icon: IconType;
}

export const SOCIAL_LINKS: ISocialLink[] = [
  {
    label: "Telegram",
    description: "Новости, акции и быстрые ответы",
    href: "https://t.me/GreenArtVlad",
    icon: FaTelegram,
  },
  {
    label: "WhatsApp",
    description: "+7 914 704-78-70",
    href: "https://wa.me/79147047870",
    icon: FaWhatsapp,
  },
  {
    label: "Instagram",
    description: "Фото букетов и наши работы",
    href: "https://www.instagram.com/greenart_studio?igsh=NGU2M2plZzc1Z3Y0",
    icon: FaInstagram,
  },
  {
    label: "2ГИС",
    description: "Как нас найти",
    href: "https://2gis.ru/vladivostok/geo/70000001006390787",
    icon: FaMapLocationDot,
  },
];
