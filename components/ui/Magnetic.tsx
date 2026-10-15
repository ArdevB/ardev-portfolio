"use client";

import { useRef, type ReactNode } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";

/** Wraps any element in a magnetic hover (transform only). */
export function Magnetic({ children, strength = 0.35, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useMagnetic(ref, strength);
  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}
