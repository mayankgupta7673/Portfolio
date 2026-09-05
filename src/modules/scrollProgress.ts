import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Thin accent bar at the very top of the viewport, tracking overall scroll depth. */
export function initScrollProgress(): void {
  const bar = document.querySelector<HTMLElement>("[data-scroll-progress] span");
  if (!bar) return;

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      bar.style.width = `${self.progress * 100}%`;
    },
  });
}
