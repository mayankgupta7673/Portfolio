// Initial theme is already applied by the blocking inline script in index.html
// (before any CSS parses); this module only wires up the toggle button(s).
export function initThemeToggle(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");
  if (!buttons.length) return;

  const label = (theme: string) => `Switch to ${theme === "dark" ? "light" : "dark"} theme`;

  const applyLabel = () => {
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    buttons.forEach((btn) => btn.setAttribute("aria-label", label(theme)));
  };
  applyLabel();

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      applyLabel();
    });
  });

  // Only follow the OS-level preference live if the visitor hasn't made an explicit choice.
  if (!localStorage.getItem("theme")) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
      applyLabel();
    });
  }
}
