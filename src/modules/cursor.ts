import { gsap } from "gsap";

export function initCursor(): void {
  const isFine = window.matchMedia("(pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!isFine || reduceMotion) return;

  const dot = document.querySelector<HTMLElement>("[data-cursor-dot]");
  const ring = document.querySelector<HTMLElement>("[data-cursor-ring]");
  if (!dot || !ring) return;

  const moveDot = gsap.quickTo(dot, "x", { duration: 0.06, ease: "power1.out" });
  const moveDotY = gsap.quickTo(dot, "y", { duration: 0.06, ease: "power1.out" });
  const moveRing = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
  const moveRingY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });

  window.addEventListener("mousemove", (e) => {
    moveDot(e.clientX);
    moveDotY(e.clientY);
    moveRing(e.clientX);
    moveRingY(e.clientY);
  });

  const interactiveSelector = "a, button, [data-magnetic], input, textarea";
  document.addEventListener("mouseover", (e) => {
    const target = (e.target as HTMLElement)?.closest(interactiveSelector);
    if (target) ring.classList.add("is-active");
  });
  document.addEventListener("mouseout", (e) => {
    const target = (e.target as HTMLElement)?.closest(interactiveSelector);
    if (target) ring.classList.remove("is-active");
  });

  document.addEventListener("mouseleave", () => {
    gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
  });
  document.addEventListener("mouseenter", () => {
    gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
  });
}
