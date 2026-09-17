import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const surfaceVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const groupVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.08 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8, filter: "blur(2px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function MotionSurface({ className, ...props }: HTMLMotionProps<"div">) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={surfaceVariants}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className={cn("will-change-transform", className)}
      {...props}
    />
  );
}

type AnimatedGroupProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  className?: string;
};

export function AnimatedGroup<T>({ items, getKey, renderItem, className }: AnimatedGroupProps<T>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={groupVariants}
      className={cn("grid gap-2", className)}
    >
      {items.map((item) => (
        <motion.div key={getKey(item)} variants={itemVariants} transition={{ duration: 0.24 }}>
          {renderItem(item)}
        </motion.div>
      ))}
    </motion.div>
  );
}