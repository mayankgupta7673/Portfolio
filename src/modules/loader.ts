import { gsap } from "gsap";

export function runLoader(): Promise<void> {
  const loader = document.querySelector<HTMLElement>("[data-loader]");
  const bar = document.querySelector<HTMLElement>("[data-loader-bar]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return new Promise((resolve) => {
    const finish = () => {
      document.body.classList.remove("is-loading");
      loader?.classList.add("is-hidden");
      resolve();
    };

    if (reduceMotion || !loader || !bar) {
      finish();
      return;
    }

    gsap.to(bar, {
      width: "100%",
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.delayedCall(0.15, finish);
      },
    });
  });
}
