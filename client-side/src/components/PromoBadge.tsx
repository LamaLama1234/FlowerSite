"use client";

import { useState } from "react";
import { Copy, Gift } from "lucide-react";
import toast from "react-hot-toast";

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ring-gold-300/50 bg-primary text-primary-foreground fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full py-2.5 pr-4 pl-3 text-sm font-semibold shadow-[0_4px_20px_-4px_rgba(184,147,91,0.5)] ring-1 transition-transform hover:-translate-y-0.5 hover:shadow-[0_6px_24px_-4px_rgba(184,147,91,0.65)]"
      >
        <span className="relative flex size-2.5 shrink-0">
          <span className="bg-gold-300 absolute inline-flex size-full animate-ping rounded-full opacity-75" />
          <span className="bg-gold-400 relative inline-flex size-2.5 rounded-full" />
        </span>
        <span className="hidden sm:inline">Промокод на первый заказ</span>
        <span className="sm:hidden">Промокод −10%</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="text-center">
          <DialogHeader className="items-center text-center">
            <span className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-full">
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
