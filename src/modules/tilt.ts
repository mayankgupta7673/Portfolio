import { gsap } from "gsap";

/**
 * Perspective tilt on hover for the project cards: they rotate to face the
 * cursor and lift slightly, using the same quickTo-eased pointer-follow
 * pattern as the magnetic buttons (see magnetic.ts). Fine-pointer devices
 * only — touch has no hover to drive this, and it's skipped under
 * prefers-reduced-motion like the rest of the site's motion.
 */
export function initTilt(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFine = window.matchMedia("(pointer: fine)").matches;
  if (reduceMotion || !isFine) return;

  const TILT_DEG = 10; // max rotation on either axis
  const LIFT_PX = -10;

  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
    gsap.set(card, { transformPerspective: 900, transformStyle: "preserve-3d" });
    const rotX = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
    const rotY = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
    const lift = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });

    card.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      rotY(relX * TILT_DEG * 2);
      rotX(relY * -TILT_DEG * 2);
      lift(LIFT_PX);
    });

    card.addEventListener("mouseleave", () => {
      rotX(0);
      rotY(0);
      lift(0);
    });
  });
}
