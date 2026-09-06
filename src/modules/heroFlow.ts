import * as THREE from "three";
import { makeGlowSprite } from "./glowSprite";

/**
 * Ambient "event flow" layer behind the hero character: small glowing packets
 * travel along curved paths between a handful of nodes — a literal, if
 * abstract, picture of event-driven integration, which is what this whole
 * site is about. Purely decorative: no interaction, and skipped entirely
 * under prefers-reduced-motion like the rest of the site's motion.
 *
 * Node x-positions are kept within +-0.42 of an orthographic camera whose
 * vertical half-height is always 1 — safe even at the narrowest mobile
 * portrait aspect (~0.45), so nothing clips off-screen on phones. On wider
 * screens the pattern just sits a little more centred rather than spanning
 * edge-to-edge, which is the right trade for an ambient background layer.
 */
export function initHeroFlow(): void {
  const host = document.querySelector<HTMLElement>("[data-hero-flow]");
  if (!host) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  // Nodes kept in the upper band and side margins, clear of the character's
  // face lower in the frame. |x| <= 0.42 stays on-screen at any aspect.
  const NODES: [number, number][] = [
    [-0.38, 0.82],
    [-0.06, 0.94],
    [0.3, 0.8],
    [0.4, 0.42],
    [-0.4, 0.4],
    [0.05, 0.58],
  ];
  const LINKS: [number, number][] = [
    [0, 1],
    [1, 2],
    [0, 4],
    [2, 3],
    [4, 5],
    [5, 3],
  ];

  NODES.forEach(([x, y]) => {
    const s = makeGlowSprite(0.09, 0.55);
    s.position.set(x, y, 0);
    scene.add(s);
  });

  const lineMat = new THREE.LineBasicMaterial({ color: 0x63d6f7, transparent: true, opacity: 0.16 });
  const paths: { curve: THREE.QuadraticBezierCurve3; packets: { sprite: THREE.Sprite; t: number; speed: number }[] }[] = [];

  LINKS.forEach(([ai, bi]) => {
    const [ax, ay] = NODES[ai];
    const [bx, by] = NODES[bi];
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(ax, ay, 0),
      new THREE.Vector3((ax + bx) / 2, Math.max(ay, by) + 0.14, 0),
      new THREE.Vector3(bx, by, 0),
    );
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)), lineMat);
    scene.add(line);

    const packets = [0, 0.5].map((startT) => {
      const sprite = makeGlowSprite(0.05, 0);
      scene.add(sprite);
      return { sprite, t: startT, speed: 0.05 + Math.random() * 0.03 };
    });
    paths.push({ curve, packets });
  });

  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    const aspect = rect.width / rect.height;
    camera.left = -aspect;
    camera.right = aspect;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  let visible = true;
  new IntersectionObserver(
    (entries) => entries.forEach((e) => (visible = e.isIntersecting)),
    { threshold: 0 },
  ).observe(host);

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    paths.forEach(({ curve, packets }) => {
      packets.forEach((p) => {
        p.t = (p.t + p.speed * 0.016) % 1;
        p.sprite.position.copy(curve.getPoint(p.t));
        // fades in/out at each end so packets don't pop at the node they start from
        (p.sprite.material as THREE.SpriteMaterial).opacity = Math.sin(p.t * Math.PI) * 0.85;
      });
    });
    renderer.render(scene, camera);
  };
  tick();
}
