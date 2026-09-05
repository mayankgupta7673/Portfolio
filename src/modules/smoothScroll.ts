import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function initSmoothScroll(): Lenis {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  lenis = new Lenis({
    duration: reduceMotion ? 0.01 : 1.1,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: !reduceMotion,
    syncTouch: false,
  });

  // Keep ScrollTrigger (pins, scrub timelines) perfectly in sync with Lenis's virtual scroll.
  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  document.body.classList.add("lenis");
  return lenis;
}

export function getLenis(): Lenis | null {
  return lenis;
}

export function scrollToHash(hash: string) {
  const target = document.querySelector(hash);
  if (!target) return;
  if (lenis) {
    lenis.scrollTo(target as HTMLElement, {
      offset: -90,
      duration: 1.5,
      easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      lock: true,
    });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
