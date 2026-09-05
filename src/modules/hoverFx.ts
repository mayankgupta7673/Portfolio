import { gsap } from "gsap";

/**
 * Pointer-following 3D tilt for cards and image tiles — the "picks it up off the page"
 * hover you get on a laptop trackpad. Skipped on touch and for reduced motion.
 */
export function initHoverFx(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (reduceMotion || !fine) return;

  const tiltTargets = gsap.utils.toArray<HTMLElement>(
    ".project-card, .service-shot, .skill-card, .about-photo, .cert-chip",
  );

  tiltTargets.forEach((el) => {
    const strength = el.classList.contains("cert-chip") ? 6 : 10;
    const setRotX = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
    const setRotY = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
    // quickTo uses resetTo internally, which cannot reset the scale shorthand,
    // so drive scaleX/scaleY separately.
    const setScaleX = gsap.quickTo(el, "scaleX", { duration: 0.5, ease: "power3.out" });
    const setScaleY = gsap.quickTo(el, "scaleY", { duration: 0.5, ease: "power3.out" });
    const setScale = (v: number) => {
      setScaleX(v);
      setScaleY(v);
    };

    gsap.set(el, { transformPerspective: 900, transformOrigin: "center" });

    el.addEventListener("pointermove", (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      setRotY(px * strength);
      setRotX(-py * strength);
      setScale(1.02);
    });

    el.addEventListener("pointerleave", () => {
      setRotX(0);
      setRotY(0);
      setScale(1);
    });
  });

  // Hero name: letters lift individually as the pointer sweeps across them
  document.querySelectorAll<HTMLElement>(".hero-name-part").forEach((part) => {
    const text = part.textContent ?? "";
    part.innerHTML = text
      .split("")
      .map((ch) => `<span class="hero-letter">${ch}</span>`)
      .join("");

    const letters = Array.from(part.querySelectorAll<HTMLElement>(".hero-letter"));
    letters.forEach((letter) => {
      const setY = gsap.quickTo(letter, "y", { duration: 0.55, ease: "power3.out" });
      const setLetterScaleX = gsap.quickTo(letter, "scaleX", { duration: 0.55, ease: "power3.out" });
      const setLetterScaleY = gsap.quickTo(letter, "scaleY", { duration: 0.55, ease: "power3.out" });
      const setLetterScale = (v: number) => {
        setLetterScaleX(v);
        setLetterScaleY(v);
      };
      letter.addEventListener("pointerenter", () => {
        setY(-18);
        setLetterScale(1.08);
      });
      letter.addEventListener("pointerleave", () => {
        setY(0);
        setLetterScale(1);
      });
    });
  });
}
