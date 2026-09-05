import { gsap } from "gsap";

/**
 * Scroll reveals driven by IntersectionObserver rather than ScrollTrigger.
 *
 * IntersectionObserver reflects the browser's own layout state, so reveals still fire
 * when the scroll position jumps in a way Lenis doesn't mediate (keyboard Page Down,
 * find-in-page, hash navigation, scroll restoration). With a scroll-position-based
 * trigger those jumps can leave content stuck at opacity 0.
 */
export function initReveals(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  if (!elements.length) return;

  if (reduceMotion) {
    gsap.set(elements, { opacity: 1, y: 0 });
    return;
  }

  gsap.set(elements, { opacity: 0, y: 26 });

  // Stagger elements that enter together, without letting one batch delay the next.
  let batch: HTMLElement[] = [];
  let flushHandle = 0;

  const flush = () => {
    flushHandle = 0;
    const items = batch;
    batch = [];
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.07,
      overwrite: "auto",
    });
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        obs.unobserve(el);
        batch.push(el);
        if (!flushHandle) flushHandle = window.setTimeout(flush, 40);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
  );

  elements.forEach((el) => observer.observe(el));

  // Safety net: if anything is still hidden but on screen after load, show it.
  window.addEventListener("load", () => {
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
      if (onScreen && Number(getComputedStyle(el).opacity) === 0) {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.6, overwrite: "auto" });
      }
    });
  });
}
