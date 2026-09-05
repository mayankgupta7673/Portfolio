import { gsap } from "gsap";

export function initCounters(): void {
  const counters = document.querySelectorAll<HTMLElement>("[data-counter]");
  if (!counters.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animate = (el: HTMLElement) => {
    const target = Number(el.dataset.counter ?? "0");
    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }
    const proxy = { value: 0 };
    gsap.to(proxy, {
      value: target,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = String(Math.round(proxy.value));
      },
    });
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target as HTMLElement);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((el) => observer.observe(el));
}
