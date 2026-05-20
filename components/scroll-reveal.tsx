"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  once?: boolean;
};

const directionOffset = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 }
};

export function ScrollReveal({ children, className, delay = 0, distance = 28, direction = "up", once = true }: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const offset = directionOffset[direction];

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: offset.x * distance, y: offset.y * distance, filter: "blur(8px)" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      viewport={{ once, amount: 0.24, margin: "0px 0px -8% 0px" }}
      whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
    >
      {children}
    </motion.div>
  );
}
