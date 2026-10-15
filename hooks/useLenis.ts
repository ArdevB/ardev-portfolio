"use client";

import { createContext, useContext } from "react";
import type Lenis from "lenis";

export const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null when smooth scroll is off (reduced motion). */
export function useLenis() {
  return useContext(LenisContext);
}
