import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver that adds "in-view" class on entry.
 * Usage: const ref = useScrollReveal(); <div ref={ref} data-reveal>
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return ref;
}
