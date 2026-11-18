import { gsap } from "gsap";

/**
 * Scroll reveals driven by IntersectionObserver rather than ScrollTrigger, so they
 * still fire after jumps Lenis doesn't mediate (keyboard, find-in-page, hash links,
 * scroll restoration).
 *
 * Each element animates in once and then stays visible — content never disappears
 * again as you scroll. Anything scrolled past before it could animate (fast flick,
 * anchor jump) is shown instantly instead of being left hidden above the viewport.
 */
export function initReveals(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  if (!elements.length) return;

  if (reduceMotion) {
    gsap.set(elements, { opacity: 1, y: 0 });
    return;
  }

  // [data-tilt] elements have tilt.ts holding a persistent quickTo on "y", so they
  // only fade — animating "y" here too trips GSAP's "not eligible for reset" warning.
  const hasTilt = (el: HTMLElement) => el.hasAttribute("data-tilt");

  elements.forEach((el) => gsap.set(el, hasTilt(el) ? { opacity: 0 } : { opacity: 0, y: 24 }));

  let batch: HTMLElement[] = [];
  let flushHandle = 0;

  const flush = () => {
    flushHandle = 0;
    const items = batch;
    batch = [];
    const plain = items.filter((el) => !hasTilt(el));
    const tilted = items.filter(hasTilt);
    if (plain.length) {
      gsap.to(plain, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.06, overwrite: "auto" });
    }
    if (tilted.length) {
      gsap.to(tilted, { opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.06, overwrite: "auto" });
    }
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          obs.unobserve(el);
          batch.push(el);
          if (!flushHandle) flushHandle = window.setTimeout(flush, 30);
        } else if (entry.boundingClientRect.bottom < 0) {
          // Already scrolled past without being seen — show it, don't leave a hole.
          obs.unobserve(el);
          gsap.set(el, hasTilt(el) ? { opacity: 1 } : { opacity: 1, y: 0 });
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );

  elements.forEach((el) => observer.observe(el));

  // Safety net: anything on screen and still hidden after load gets shown.
  window.addEventListener("load", () => {
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
      if (onScreen && Number(getComputedStyle(el).opacity) === 0) {
        gsap.to(el, hasTilt(el) ? { opacity: 1, duration: 0.6, overwrite: "auto" } : { opacity: 1, y: 0, duration: 0.6, overwrite: "auto" });
      }
    });
  });
}
