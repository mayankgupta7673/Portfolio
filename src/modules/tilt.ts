import { gsap } from "gsap";

/**
 * Perspective tilt on hover: elements rotate to face the cursor and lift
 * slightly, using the same quickTo-eased pointer-follow pattern as the
 * magnetic buttons (see magnetic.ts). Fine-pointer devices only — touch has
 * no hover to drive this, and it's skipped under prefers-reduced-motion like
 * the rest of the site's motion.
 *
 * Intensity is per-element via data attributes so the same behaviour can be
 * reused at different scales — full tilt on the large project cards,
 * a lighter touch on the small cert-chip badges:
 *   data-tilt-deg="6"   max rotation on either axis (default 10)
 *   data-tilt-lift="-4" vertical lift in px on hover (default -10)
 */
export function initTilt(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFine = window.matchMedia("(pointer: fine)").matches;
  if (reduceMotion || !isFine) return;

  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
    const tiltDeg = Number(card.dataset.tiltDeg) || 10;
    const liftPx = Number(card.dataset.tiltLift) || -10;

    gsap.set(card, { transformPerspective: 900, transformStyle: "preserve-3d" });
    const rotX = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
    const rotY = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
    const lift = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });

    card.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      rotY(relX * tiltDeg * 2);
      rotX(relY * -tiltDeg * 2);
      lift(liftPx);
    });

    card.addEventListener("mouseleave", () => {
      rotX(0);
      rotY(0);
      lift(0);
    });
  });
}
