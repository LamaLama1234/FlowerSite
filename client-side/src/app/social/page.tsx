import type { Metadata } from "next";

import { Social } from "./Social";

export const metadata: Metadata = {
  title: "Мы в соцсетях",
};

export default function SocialPage() {
  return <Social />;
}
