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
import { initChalklineTimeline } from "./modules/chalklineTimeline";
import { initStatement, initShapes } from "./modules/statement";
import { initTestimonials } from "./modules/testimonialCarousel";
import { initCounters } from "./modules/counters";
import { initReveals } from "./modules/reveals";
import { initHoverFx } from "./modules/hoverFx";
import { initScrollProgress } from "./modules/scrollProgress";
import { initHeadingReveal } from "./modules/headingReveal";
import { initThemeToggle } from "./modules/theme";
import { initAnalytics } from "./modules/analytics";

gsap.registerPlugin(ScrollTrigger);

/**
 * Three.js is ~500KB, and none of it is needed for the hero. Each 3D scene loads when
 * its section nears the viewport — or, failing that, during idle time a few seconds
 * after load (`warmAfterMs`, staggered per scene). Pre-warming matters because WebGL
 * context + shader setup is a 300-500ms main-thread stall that otherwise lands
 * mid-scroll, right as the section arrives.
 */
function lazyScene(selector: string, load: () => Promise<unknown>, rootMargin = "400px 0px", warmAfterMs = 0) {
  const el = document.querySelector(selector);
  if (!el) return;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    io.disconnect();
    void load();
  };
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) start();
    },
    { rootMargin },
  );
  io.observe(el);

  if (warmAfterMs > 0) {
    window.addEventListener("load", () => {
      window.setTimeout(() => {
        if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 2000 });
        else start();
      }, warmAfterMs);
    });
  }
}

function bootstrap() {
  // Content is static HTML (see index.html); these layer behavior on top of it.
  initThemeToggle();
  initMarquee();
  initStatement();
  initShapes();
  initJourney();
  initChalklineTimeline();
  initTestimonials();
  initAnalytics();

  // 3D scenes, loaded on approach
  lazyScene("[data-hero-flow]", async () => {
    const { initHeroFlow } = await import("./modules/heroFlow");
    initHeroFlow();
  });

  lazyScene("[data-arch-diagram]", async () => {
    const { initArchDiagram } = await import("./modules/archDiagram");
    initArchDiagram();
  }, "400px 0px", 3500);

  lazyScene("[data-skill-constellation]", async () => {
    const { initSkillConstellation } = await import("./modules/skillConstellation");
    initSkillConstellation();
  }, "400px 0px", 8000);


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
  }, "400px 0px", 5000);

  // Heaviest lazy scene (WebGL + UnrealBloomPass shader compilation), so it gets a much
  // larger rootMargin than the rest — loading starts while "work" is still on screen,
  // instead of the compile stall landing right as the ring section reaches the viewport.
  lazyScene(
    "[data-ring]",
    async () => {
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
        // A full ScrollTrigger.refresh() re-measures every trigger on the page — deferred
        // a frame so it doesn't add to the same tick as the WebGL/shader setup above.
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }
    },
    "1200px 0px",
    9500,
  );

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
  initHeadingReveal();

  // Fonts and images shift layout; re-measure pinned/scrubbed triggers afterwards.
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if ("fonts" in document) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  runLoader().then(() => playHeroIntro());
}

bootstrap();
