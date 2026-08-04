"use client";

import { Children } from "react";
import { m, type Variants } from "motion/react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      initial="hidden"
      animate="show"
      variants={container}
    >
      {Children.map(children, (child) => (
        <m.div variants={item}>{child}</m.div>
      ))}
    </m.div>
  );
}
