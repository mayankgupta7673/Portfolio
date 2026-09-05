export function initMarquee(): void {
  const track = document.querySelector<HTMLElement>("[data-marquee-track]");
  if (!track) return;
  // Duplicate the content once so the CSS animation (translateX(-50%)) loops seamlessly.
  track.insertAdjacentHTML("beforeend", track.innerHTML);
}
