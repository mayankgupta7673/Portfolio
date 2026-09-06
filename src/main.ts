// style.css is loaded via a <link> in index.html, not imported here — see the
// comment above that tag for why (avoids a flash of unstyled content in dev).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { runLoader } from "./modules/loader";
import { playHeroIntro } from "./modules/heroIntro";
import { initSmoothScroll } from "./modules/smoothScroll";
import { initCursor } from "./modules/cursor";
import { initMagnetic } from "./modules/magnetic";
import { initTilt } from "./modules/tilt";
import { initNav } from "./modules/nav";
import { initMarquee } from "./modules/marquee";
import { initJourney } from "./modules/journey";
import { initStatement, initShapes } from "./modules/statement";
import { initTestimonials } from "./modules/testimonialCarousel";
import { initCounters } from "./modules/counters";
import { initReveals } from "./modules/reveals";
import { initHoverFx } from "./modules/hoverFx";
import { initScrollProgress } from "./modules/scrollProgress";
import { initScrambleReveal } from "./modules/scrambleReveal";

gsap.registerPlugin(ScrollTrigger);

/**
 * Three.js is ~500KB, and none of it is needed for the hero. Load each 3D scene
 * only once its section is close to the viewport so first paint stays fast.
 */
function lazyScene(selector: string, load: () => Promise<unknown>) {
  const el = document.querySelector(selector);
  if (!el) return;
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      void load();
    },
    { rootMargin: "400px 0px" },
  );
  io.observe(el);
}

function bootstrap() {
  // Content is static HTML (see index.html); these layer behavior on top of it.
  initMarquee();
  initStatement();
  initShapes();
  initJourney();
  initTestimonials();

  // 3D scenes, loaded on approach
  lazyScene("[data-hero-flow]", async () => {
    const { initHeroFlow } = await import("./modules/heroFlow");
    initHeroFlow();
  });

  lazyScene("[data-arch-diagram]", async () => {
    const { initArchDiagram } = await import("./modules/archDiagram");
    initArchDiagram();
  });

  lazyScene("[data-skill-constellation]", async () => {
    const { initSkillConstellation } = await import("./modules/skillConstellation");
    initSkillConstellation();
  });


  // Cursor companion follows you across the whole page, so unlike the other
  // scenes it isn't gated behind an IntersectionObserver — but its ~150KB
  // (Three.js + gsap chunk) still shouldn't compete with the hero's own
  // images/fonts for bandwidth during first paint. Deferred to the next idle
  // moment instead; Safari has no requestIdleCallback, hence the fallback.
  const idle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 1200));
  idle(() => {
    void import("./modules/companion").then(({ initCompanion }) => initCompanion());
  });

  lazyScene("[data-globe]", async () => {
    const { initGlobe } = await import("./modules/globe");
    initGlobe();
  });

  lazyScene("[data-ring]", async () => {
    const { initRingGallery } = await import("./modules/ringGallery");
    const ring = initRingGallery();
    const ringTrack = document.querySelector<HTMLElement>("[data-ring-track]");
    if (ring && ringTrack) {
      ScrollTrigger.create({
        trigger: ringTrack,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => ring.setScroll(self.progress),
      });
      ScrollTrigger.refresh();
    }
  });

  // Interaction layer
  initSmoothScroll();
  initCursor();
  initMagnetic();
  initTilt();
  initNav();
  initCounters();
  initReveals();
  initHoverFx();
  initScrollProgress();
  initScrambleReveal();

  // Fonts and images shift layout; re-measure pinned/scrubbed triggers afterwards.
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if ("fonts" in document) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  runLoader().then(() => playHeroIntro());
}

bootstrap();
