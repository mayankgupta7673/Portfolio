import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Word-by-word "lighting up" of the statement line as it scrolls through the viewport —
 * the effect Juan Mora uses on his big statements.
 */
export function initStatement(): void {
  const el = document.querySelector<HTMLElement>("[data-statement]");
  if (!el) return;

  const text = el.textContent?.trim() ?? "";
  if (!text) return;

  el.innerHTML = text
    .split(/\s+/)
    .map((word) => `<span class="w">${word}</span>`)
    .join(" ");

  const words = Array.from(el.querySelectorAll<HTMLElement>(".w"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    words.forEach((w) => w.classList.add("is-lit"));
    return;
  }

  ScrollTrigger.create({
    trigger: el,
    start: "top 78%",
    end: "bottom 55%",
    scrub: true,
    onUpdate: (self) => {
      const lit = Math.round(self.progress * words.length);
      words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
    },
  });
}

/** Floating glossy shapes with scroll parallax, used behind the globe section. */
export function initShapes(): void {
  const field = document.querySelector<HTMLElement>("[data-shape-field]");
  if (!field) return;

  const defs = [
    { cls: "blob", size: 190, x: "4%", y: "8%", depth: 0.28 },
    { cls: "blob pill", size: 130, x: "84%", y: "16%", depth: 0.44 },
    { cls: "blob squircle", size: 110, x: "72%", y: "70%", depth: 0.2 },
    { cls: "blob", size: 74, x: "14%", y: "74%", depth: 0.52 },
    { cls: "blob-dot", size: 18, x: "60%", y: "12%", depth: 0.7 },
    { cls: "blob-dot", size: 12, x: "26%", y: "44%", depth: 0.62 },
  ];

  const nodes = defs.map((d) => {
    const el = document.createElement("div");
    el.className = d.cls;
    el.style.width = `${d.size}px`;
    el.style.height = d.cls.includes("pill") ? `${d.size * 0.55}px` : `${d.size}px`;
    el.style.left = d.x;
    el.style.top = d.y;
    field.appendChild(el);
    return { el, depth: d.depth };
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const section = field.closest("section");
  if (!section) return;

  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress - 0.5;
      nodes.forEach(({ el, depth }) => {
        gsap.set(el, { y: p * 320 * depth, rotate: p * 40 * depth });
      });
    },
  });
}
