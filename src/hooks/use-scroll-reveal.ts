import { useEffect, useRef, useCallback } from "react";

export type RevealType = "fade-up" | "fade-left" | "fade-right" | "zoom-in" | "fade-up-scale" | "slide-up" | "rotate-in" | "flip-left" | "flip-right";

type RevealOptions = {
  type?: RevealType;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  delay?: number;
};

/**
 * Freebuff-style scroll reveal.
 * Adds `.revealed` class when element enters viewport.
 * The CSS class `.reveal-fade-up`, `.reveal-fade-left`, etc. controls the animation.
 */
export function useScrollReveal({
  type = "fade-up",
  threshold = 0.12,
  rootMargin = "0px 0px -40px 0px",
  once = true,
  delay = 0,
}: RevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Set the animation type as a data attribute for CSS
    node.setAttribute("data-reveal", type);
    if (delay > 0) node.style.transitionDelay = `${delay}s`;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      node.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("revealed");
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [type, threshold, rootMargin, once, delay]);

  return setRef;
}
