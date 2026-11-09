// GA4 is loaded in index.html; gtag may be missing if a blocker strips it, hence the guard.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const TRACKED_CTAS: { selector: string; label: string }[] = [
  { selector: "a[href^='mailto:']", label: "email_click" },
  { selector: "a[href='https://www.linkedin.com/in/mayankgupta7673/']", label: "linkedin_click" },
  { selector: "a[href$='.pdf'][download]", label: "resume_download" },
];

export function initAnalytics(): void {
  for (const { selector, label } of TRACKED_CTAS) {
    document.querySelectorAll<HTMLAnchorElement>(selector).forEach((el) => {
      el.addEventListener("click", () => {
        window.gtag?.("event", label, { link_url: el.href });
      });
    });
  }
}
