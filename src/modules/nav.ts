import { scrollToHash } from "./smoothScroll";

export function initNav(): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const menuToggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const mobileNav = document.querySelector<HTMLElement>("[data-mobile-nav]");
  const yearEls = document.querySelectorAll<HTMLElement>("[data-year]");

  yearEls.forEach((el) => (el.textContent = String(new Date().getFullYear())));

  let lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (!header) return;
      header.classList.toggle("is-hidden", y > lastY && y > 260);
      lastY = y;
    },
    { passive: true },
  );

  // Invert the header while it sits over a dark section
  const darkSections = Array.from(document.querySelectorAll<HTMLElement>(".journey, .ring-section, .site-footer"));
  const hero = document.querySelector<HTMLElement>(".hero");
  const updateHeaderTheme = () => {
    if (!header) return;
    const probe = header.getBoundingClientRect().height / 2;
    const overDark = darkSections.some((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    header.classList.toggle("on-dark-section", overDark);

    // the hero art is dark and warm, so the header gets its own warm-light treatment
    const heroRect = hero?.getBoundingClientRect();
    const overHero = !!heroRect && heroRect.top <= probe && heroRect.bottom >= probe;
    header.classList.toggle("hero-lit", overHero);
  };
  window.addEventListener("scroll", updateHeaderTheme, { passive: true });
  updateHeaderTheme();

  const closeMenu = () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    mobileNav?.classList.remove("is-open");
    document.body.style.overflow = "";
  };
  const openMenu = () => {
    menuToggle?.setAttribute("aria-expanded", "true");
    mobileNav?.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };
  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  // Every in-page link scrolls smoothly — nav, hero buttons, footer links, back-to-top.
  const internalLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
  internalLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || !document.querySelector(href)) return;
      e.preventDefault();
      closeMenu();
      scrollToHash(href);
      history.pushState(null, "", href);
    });
  });

  const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
  const pillLinks = document.querySelectorAll<HTMLAnchorElement>(".nav-pill [data-nav-link]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        pillLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
  );
  sections.forEach((section) => observer.observe(section));
}
