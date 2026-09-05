import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

/**
 * Section headings resolve out of scrambled characters as they scroll into view.
 * Only applied to elements with plain text content (no nested markup) — the plugin
 * rewrites the element's innerHTML frame-by-frame, which would otherwise clobber
 * child elements like the gradient-text spans used elsewhere.
 */
export function initScrambleReveal(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const targets = gsap.utils.toArray<HTMLElement>(".section-title, .contact-title");

  targets.forEach((el) => {
    if (el.querySelector("*")) return; // has child markup — skip, don't risk mangling it
    const original = el.textContent ?? "";
    if (!original.trim()) return;

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(el, {
          duration: 1,
          ease: "none",
          scrambleText: {
            text: original,
            chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ01",
            revealDelay: 0.25,
            speed: 0.4,
          },
        });
      },
    });
  });
}
