import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "./smoothScroll";

gsap.registerPlugin(ScrollTrigger);

/**
 * Chapter markup lives statically in index.html (inside [data-journey]) so the career
 * history is crawlable. This pins the section and cross-fades chapters on scroll,
 * driving the 3D stage alongside.
 */
export function initJourney(): void {
  const track = document.querySelector<HTMLElement>("[data-journey]");
  if (!track) return;

  const chapters = Array.from(track.querySelectorAll<HTMLElement>("[data-chapter]"));
  if (!chapters.length) return;

  const progressBar = document.querySelector<HTMLElement>("[data-journey-progress]");
  const indexEl = document.querySelector<HTMLElement>("[data-journey-index] .current");
  const dots = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-journey-dot]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Three.js loads only when the story section is near, keeping first paint light.
  let stage: { setChapter(i: number): void; setScroll(p: number): void } | null = null;
  const stageObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      stageObserver.disconnect();
      void import("./journeyStage").then(({ initJourneyStage }) => {
        stage = initJourneyStage();
      });
    },
    { rootMargin: "400px 0px" },
  );
  stageObserver.observe(track);

  // Chapters hand over sequentially: the outgoing one is fully gone before the
  // incoming one appears, so two chapters are never stacked on screen at once.
  const OUT_START = 0.68;
  const OUT_END = 0.84;
  const IN_START = 0.86;

  const setChapter = (index: number, localProgress: number) => {
    chapters.forEach((chapter, i) => {
      let opacity = 0;
      let y = 0;

      if (i === index) {
        if (localProgress <= OUT_START) {
          opacity = 1;
          y = 0;
        } else if (localProgress < OUT_END) {
          const t = (localProgress - OUT_START) / (OUT_END - OUT_START);
          opacity = 1 - t;
          y = -t * 34;
        } else {
          opacity = 0;
          y = -34;
        }
      } else if (i === index + 1) {
        if (localProgress <= IN_START) {
          opacity = 0;
          y = 34;
        } else {
          const t = (localProgress - IN_START) / (1 - IN_START);
          opacity = t;
          y = 34 * (1 - t);
        }
      } else {
        opacity = 0;
        y = i < index ? -34 : 34;
      }

      chapter.style.opacity = String(opacity);
      chapter.style.transform = `translateY(${y}px)`;
      // Keep fully-faded chapters out of the layer entirely so nothing ghosts through.
      chapter.style.visibility = opacity < 0.02 ? "hidden" : "visible";
    });
    if (indexEl) indexEl.textContent = String(index + 1).padStart(2, "0");
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    // Swap the 3D shape at the halfway point of each transition
    stage?.setChapter(localProgress > 0.85 ? Math.min(chapters.length - 1, index + 1) : index);
  };

  setChapter(0, 0);

  if (reduceMotion || chapters.length < 2) {
    chapters.forEach((chapter, i) => {
      chapter.style.opacity = i === 0 ? "1" : "0";
    });
    return;
  }

  const totalSteps = chapters.length - 1;

  const st = ScrollTrigger.create({
    trigger: track,
    start: "top top",
    end: () => `+=${totalSteps * 72}%`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    onUpdate: (self) => {
      const raw = self.progress * totalSteps;
      const index = Math.min(totalSteps, Math.floor(raw));
      const localProgress = raw - index;
      setChapter(index, localProgress);
      stage?.setScroll(self.progress);
      if (progressBar) progressBar.style.width = `${self.progress * 100}%`;
    },
  });

  // Chapter-select: jump straight to a chapter's position within the pinned scrub range.
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      const target = st.start + ((st.end - st.start) * i) / totalSteps + 1;
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
      } else {
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    });
  });
}
