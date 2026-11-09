import { gsap } from "gsap";

/**
 * Single-open FAQ accordion — opening a question closes whichever panel was open.
 */
export function initFaqAccordion(): void {
  const root = document.querySelector<HTMLElement>("[data-faq]");
  if (!root) return;

  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-faq-item]"));
  if (!items.length) return;

  let openItem: HTMLElement | null = null;

  const refs = (item: HTMLElement) => ({
    question: item.querySelector<HTMLButtonElement>("[data-faq-question]"),
    answer: item.querySelector<HTMLElement>("[data-faq-answer]"),
  });

  const close = (item: HTMLElement, animate: boolean) => {
    const { question, answer } = refs(item);
    if (!question || !answer) return;
    item.classList.remove("is-open");
    question.setAttribute("aria-expanded", "false");
    answer.setAttribute("aria-hidden", "true");
    if (animate) {
      gsap.to(answer, { height: 0, opacity: 0, duration: 0.35, ease: "power2.inOut" });
    } else {
      gsap.set(answer, { height: 0, opacity: 0 });
    }
  };

  const open = (item: HTMLElement) => {
    const { question, answer } = refs(item);
    if (!question || !answer) return;
    item.classList.add("is-open");
    question.setAttribute("aria-expanded", "true");
    answer.removeAttribute("aria-hidden");
    // Animate to the panel's natural height, then clear the inline height so
    // content reflow (resize, font load) still works afterwards.
    gsap.fromTo(
      answer,
      { height: 0, opacity: 0 },
      { height: "auto", opacity: 1, duration: 0.45, ease: "power2.out", clearProps: "height" },
    );
  };

  items.forEach((item) => {
    const { question, answer } = refs(item);
    if (!question || !answer) return;
    close(item, false);

    question.addEventListener("click", () => {
      const wasOpen = openItem === item;
      if (openItem) close(openItem, true);
      openItem = wasOpen ? null : item;
      if (openItem) open(openItem);
    });
  });
}
