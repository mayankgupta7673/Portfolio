import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A soft focus-pull on section headings as they scroll into view — replaces
 * the old scramble-text effect. Only touches `filter`, so it layers cleanly
 * on top of the opacity/translate reveal already applied by reveals.ts
 * instead of fighting it for the same property.
 */
export function initHeadingReveal(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const targets = gsap.utils.toArray<HTMLElement>(".section-title, .contact-title");
  if (!targets.length) return;

  gsap.set(targets, { filter: "blur(10px)" });

  targets.forEach((el) => {
    const focus = () => gsap.to(el, { filter: "blur(0px)", duration: 0.9, ease: "power2.out", overwrite: "auto" });
    const blur = () => gsap.set(el, { filter: "blur(10px)" });

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: focus,
      onEnterBack: focus,
      onLeave: blur,
      onLeaveBack: blur,
    });
  });
}
