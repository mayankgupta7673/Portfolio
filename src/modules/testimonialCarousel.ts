/**
 * Slides and dot buttons are hand-written in index.html so testimonials are present
 * in the static HTML. This module only wires up autoplay, controls, and active state.
 */
export function initTestimonials(): void {
  const trackEl = document.querySelector<HTMLElement>("[data-testimonial-track]");
  const dotsEl = document.querySelector<HTMLElement>("[data-testimonial-dots]");
  const prevBtn = document.querySelector<HTMLButtonElement>("[data-testimonial-prev]");
  const nextBtn = document.querySelector<HTMLButtonElement>("[data-testimonial-next]");
  const carousel = document.querySelector<HTMLElement>("[data-testimonial-carousel]");
  if (!trackEl || !dotsEl) return;

  const slides = Array.from(trackEl.querySelectorAll<HTMLElement>(".testimonial-slide"));
  const dots = Array.from(dotsEl.querySelectorAll<HTMLButtonElement>("button"));
  if (!slides.length) return;

  let current = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
  let timer: number | undefined;

  const show = (index: number) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === current));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
  };

  const restartAutoplay = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(current + 1), 6000);
  };

  prevBtn?.addEventListener("click", () => {
    show(current - 1);
    restartAutoplay();
  });
  nextBtn?.addEventListener("click", () => {
    show(current + 1);
    restartAutoplay();
  });
  dots.forEach((dot, i) =>
    dot.addEventListener("click", () => {
      show(i);
      restartAutoplay();
    }),
  );

  carousel?.addEventListener("mouseenter", () => window.clearInterval(timer));
  carousel?.addEventListener("mouseleave", restartAutoplay);

  restartAutoplay();
}
