import { gsap } from "gsap";

export function initMagnetic(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFine = window.matchMedia("(pointer: fine)").matches;
  if (reduceMotion || !isFine) return;

  const els = document.querySelectorAll<HTMLElement>("[data-magnetic]");

  els.forEach((el) => {
    const moveX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const moveY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    el.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      moveX(relX * 0.35);
      moveY(relY * 0.35);
    });

    el.addEventListener("mouseleave", () => {
      moveX(0);
      moveY(0);
    });
  });
}
