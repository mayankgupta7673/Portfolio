import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A chalk line pulled taut between two nails: scattered milestone cards snap
 * onto it, in date order, the first time the strip scrolls into view.
 */
export function initChalklineTimeline(): void {
  const root = document.querySelector<HTMLElement>("[data-chalkline]");
  if (!root) return;

  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-chalkline-card]"));
  if (!cards.length) return;

  const svg = root.querySelector<SVGSVGElement>("[data-chalkline-svg]");
  const path = svg?.querySelector<SVGPathElement>("[data-chalkline-path]") ?? null;
  const nails = Array.from(root.querySelectorAll<SVGCircleElement>("[data-chalkline-nail]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scatter the cards around their resting spot — read by the CSS rule
  // `transform: translate(var(--x), var(--y)) rotate(var(--rot))`.
  cards.forEach((card) => {
    const x = gsap.utils.random(-120, 120, 1);
    const y = gsap.utils.random(-70, 90, 1);
    const rot = gsap.utils.random(-16, 16, 1);
    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
    card.style.setProperty("--rot", `${rot}deg`);
  });

  if (reduceMotion) {
    gsap.set(cards, { x: 0, y: 0, rotation: 0 });
    return;
  }

  // Redraws the line as a quadratic curve bowing toward `controlY`; the two
  // nails stay fixed at the ends.
  const drawLine = (controlY: number) => {
    if (!path || !svg) return;
    const w = svg.clientWidth || root.clientWidth;
    const h = svg.clientHeight || 90;
    const midY = h / 2;
    path.setAttribute("d", `M 6 ${midY} Q ${w / 2} ${controlY} ${w - 6} ${midY}`);
  };

  const snapCards = () =>
    gsap.to(cards, { x: 0, y: 0, rotation: 0, duration: 0.9, ease: "back.out(1.7)", stagger: 0.09 });

  const play = () => {
    if (!svg || !path) {
      snapCards();
      return;
    }
    const h = svg.clientHeight || 90;
    const midY = h / 2;
    const pull = { y: midY };
    drawLine(midY);

    gsap
      .timeline()
      // pulled down…
      .to(pull, {
        y: midY + h * 1.6,
        duration: 0.42,
        ease: "power2.in",
        onUpdate: () => drawLine(pull.y),
      })
      // …then released, snapping elastically back to taut
      .to(
        pull,
        {
          y: midY,
          duration: 1.15,
          ease: "elastic.out(1, 0.3)",
          onUpdate: () => drawLine(pull.y),
        },
        "-=0.05",
      )
      .fromTo(
        nails,
        { scale: 1, transformOrigin: "50% 50%" },
        { scale: 1.3, duration: 0.14, yoyo: true, repeat: 1 },
        0,
      )
      // the cards land on the line in date order (DOM order = stagger index)
      .add(snapCards, 0.3);
  };

  ScrollTrigger.create({
    trigger: root,
    start: "top 72%",
    once: true,
    onEnter: play,
  });
}
