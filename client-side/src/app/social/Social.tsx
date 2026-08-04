import { ArrowUpRight } from "lucide-react";

import { SOCIAL_LINKS } from "@/constants/social.constants";
import { GoldDivider } from "@/components/decorative/GoldDivider";
import { CornerFlourish } from "@/components/decorative/CornerFlourish";

export function Social() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <div className="text-center">
        <h1 className="font-heading text-3xl text-primary sm:text-4xl">
          Мы в соцсетях
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Пишите, звоните, заходите — мы всегда на связи
        </p>
      </div>

      <GoldDivider variant="flower" className="my-8" />

      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_LINKS.map(({ label, description, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="border-gold-200/50 hover:border-gold-300/70 group bg-card relative flex items-center gap-4 overflow-hidden rounded-2xl border p-5 transition-colors duration-150"
          >
            <CornerFlourish corner="tr" />

            <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
              <Icon className="size-6" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg text-primary">{label}</h2>
              <p className="text-muted-foreground truncate text-sm">
                {description}
              </p>
            </div>

            <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-5 shrink-0 transition-colors" />
          </a>
        ))}
      </div>
    </main>
  );
}
