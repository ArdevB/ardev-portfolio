"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Sets data-inview="true" once the element enters the viewport; CSS does the animating. */
export function InView({
  children,
  className,
  style,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "ul" | "dl";
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // @ts-expect-error — polymorphic ref
    <Tag ref={ref} data-inview={inView} className={className} style={style}>
      {children}
    </Tag>
  );
}
