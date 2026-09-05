import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function playHeroIntro(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const media = document.querySelector<HTMLElement>(
    "[data-hero-media] img, [data-hero-media] video",
  );
  const kicker = document.querySelector<HTMLElement>("[data-hero-kicker]");
  const nameParts = gsap.utils.toArray<HTMLElement>(".hero-name-part");
  const sub = document.querySelector<HTMLElement>("[data-hero-sub]");
  const actions = document.querySelector<HTMLElement>("[data-hero-actions]");
  const header = document.querySelector<HTMLElement>("[data-header]");
  const cue = document.querySelector<HTMLElement>(".scroll-cue");

  const fadeTargets = [kicker, sub, actions, header, cue].filter(Boolean) as HTMLElement[];

  if (reduceMotion) {
    gsap.set([...fadeTargets, ...nameParts], { opacity: 1, y: 0 });
    return;
  }

  if (fadeTargets.length) gsap.set(fadeTargets, { opacity: 0, y: 18 });
  if (nameParts.length) gsap.set(nameParts, { yPercent: 108, opacity: 1 });
  if (media) gsap.set(media, { scale: 1.14 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // Only queue tweens for elements that are actually present — handing GSAP an empty
  // array logs "target not found".
  if (media) tl.to(media, { scale: 1.02, duration: 1.8, ease: "power2.out" }, 0);
  if (nameParts.length) tl.to(nameParts, { yPercent: 0, duration: 1.15, stagger: 0.09 }, 0.15);
  if (header) tl.to(header, { opacity: 1, y: 0, duration: 0.6 }, 0.2);
  if (kicker) tl.to(kicker, { opacity: 1, y: 0, duration: 0.7 }, 0.3);
  if (sub) tl.to(sub, { opacity: 1, y: 0, duration: 0.7 }, 0.85);
  if (actions) tl.to(actions, { opacity: 1, y: 0, duration: 0.7 }, 0.95);
  if (cue) tl.to(cue, { opacity: 1, y: 0, duration: 0.6 }, 1.1);

  // Parallax the hero art as you scroll away from it
  const hero = document.querySelector<HTMLElement>(".hero");
  if (hero && media) {
    gsap.to(media, {
      yPercent: 10,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
  }
}
