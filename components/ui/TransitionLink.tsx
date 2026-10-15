"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type RefObject } from "react";
import { usePageTransition } from "@/components/providers/TransitionProvider";

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    /** Title shown on the transition panel. */
    transitionTitle?: string;
    /** Element to morph into the destination hero (shared-element transition). */
    sharedRef?: RefObject<HTMLElement | null>;
  };

export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, transitionTitle, sharedRef, onClick, children, ...rest },
  ref,
) {
  const { navigate } = usePageTransition();
  return (
    <Link
      ref={ref}
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (rest.target === "_blank") return;
        const target = typeof href === "string" ? href : (href.pathname ?? "/");
        const url = new URL(target, window.location.href);
        // Same-page hash links are handled by Lenis.
        if (url.pathname === window.location.pathname && url.hash) return;
        e.preventDefault();
        navigate(target, { title: transitionTitle, sharedElement: sharedRef?.current ?? null });
      }}
    >
      {children}
    </Link>
  );
});
