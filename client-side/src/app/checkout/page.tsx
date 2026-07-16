import type { Metadata } from "next";

import { Checkout } from "./Checkout";

export const metadata: Metadata = {
  title: "Оформление заказа",
};

export default function CheckoutPage() {
  return <Checkout />;
}
