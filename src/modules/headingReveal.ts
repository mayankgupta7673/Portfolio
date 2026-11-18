import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A light-sweep underline that draws in under each section heading once it
 * scrolls into view. Transform-only (scaleX), so it costs nothing while scrolling —
 * unlike blur or filter effects on large text.
 */
export function initHeadingReveal(): void {
  const targets = gsap.utils.toArray<HTMLElement>(".section-title, .contact-title");
  if (!targets.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  targets.forEach((el) => {
    el.classList.add("has-sweep");
    if (reduceMotion) {
      el.classList.add("is-swept");
      return;
    }
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => el.classList.add("is-swept"),
    });
  });
}
