"use client";

import { useState } from "react";
import { Copy, Gift } from "lucide-react";
import toast from "react-hot-toast";
import { m } from "motion/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WELCOME_PROMO_CODE } from "@/constants/promo.constants";

export function PromoBadge() {
  const [open, setOpen] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(WELCOME_PROMO_CODE);
      toast.success("Промокод скопирован");
    } catch {
      toast.error("Не удалось скопировать — введите код вручную");
    }
  }

  return (
    <>
      <m.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3, ease: "easeOut" }}
        className="ring-gold-300/50 bg-primary text-primary-foreground hover:bg-primary/90 fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full py-2.5 pr-4 pl-3 text-sm font-semibold shadow-sm ring-1 transition-colors duration-150"
      >
        <span className="bg-gold-400 size-2.5 shrink-0 rounded-full" />
        <span className="hidden sm:inline">Промокод на первый заказ</span>
        <span className="sm:hidden">Промокод −10%</span>
      </m.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="text-center">
          <DialogHeader className="items-center text-center">
            <span className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-xl">
              <Gift className="size-6" />
            </span>
            <DialogTitle className="text-2xl">−10% на первый заказ</DialogTitle>
            <DialogDescription>
              Примените промокод при оформлении заказа.
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={handleCopy}
            className="border-gold-300/60 bg-gold-50 text-gold-700 hover:border-gold-400/80 group flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-lg font-semibold tracking-widest transition-colors"
          >
            {WELCOME_PROMO_CODE}
            <Copy className="size-4 opacity-60 transition-opacity group-hover:opacity-100" />
          </button>

          <Button onClick={() => setOpen(false)}>Понятно, спасибо</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
