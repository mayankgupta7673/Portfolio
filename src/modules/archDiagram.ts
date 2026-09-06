import * as THREE from "three";
import { gsap } from "gsap";
import { getIconTexture } from "./iconTexture";
import { makeTintedDot } from "./glowSprite";

/**
 * A small hub-and-spoke diagram — Azure at the centre, the core integration
 * services as satellites — that assembles itself the first time it scrolls
 * into view, then idles with small drifting "packets" along each spoke.
 * A literal picture of the architecture the project cards below describe,
 * rather than just naming it in text.
 */
const SATELLITES = [
  "/icons/functions.svg",
  "/icons/apim.svg",
  "/icons/data.svg",
  "/icons/ai.svg",
  "/icons/cicd.svg",
  "/icons/monitoring.svg",
];

export function initArchDiagram(): void {
  const host = document.querySelector<HTMLElement>("[data-arch-diagram]");
  if (!host) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  // Everything lives at unit-circle scale inside this group, then the whole
  // group is scaled to fit on resize — simpler than recomputing every
  // position by hand for each aspect ratio.
  const group = new THREE.Group();
  scene.add(group);

  const iconPlane = (src: string, size: number) => {
    const tex = getIconTexture(src);
    return new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthTest: false }),
    );
  };

  const hub = iconPlane("/icons/azure.svg", 0.5);
  group.add(hub);

  type Satellite = { mesh: THREE.Mesh; baseX: number; baseY: number };
  const satellites: Satellite[] = [];
  const lines: THREE.Line[] = [];
  const packets: { sprite: THREE.Sprite; t: number }[] = [];

  SATELLITES.forEach((src, i) => {
    const angle = (i / SATELLITES.length) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);

    // Azure-deep, not the brighter cyan used on dark sections — this sits on
    // the page's light background, where a pale cyan line barely reads at all.
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1c6cb8, transparent: true, opacity: 0 });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, 0)]),
      lineMat,
    );
    group.add(line);
    lines.push(line);

    const mesh = iconPlane(src, 0.34);
    mesh.position.set(x, y, 0);
    mesh.scale.setScalar(0.001);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0;
    group.add(mesh);
    satellites.push({ mesh, baseX: x, baseY: y });

    // Tinted, alpha-blended dot rather than the additive glow used on dark
    // scenes — additive light barely shows up against this light background.
    const sprite = makeTintedDot(0x1c6cb8, 0.07, 0);
    group.add(sprite);
    packets.push({ sprite, t: i / SATELLITES.length });
  });

  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    const aspect = rect.width / rect.height;
    camera.left = -aspect;
    camera.right = aspect;
    camera.updateProjectionMatrix();
    // The orthographic camera's vertical span is fixed at +-1 regardless of
    // aspect, so a fixed scale reliably fills most of the frame's height —
    // the previous aspect-scaled fit topped out at 0.62 and left the diagram
    // looking small inside a much wider box.
    group.scale.setScalar(0.78);
  };
  resize();
  window.addEventListener("resize", resize);

  let played = false;
  const play = () => {
    if (played) return;
    played = true;
    if (reduceMotion) {
      hub.scale.setScalar(1);
      (hub.material as THREE.MeshBasicMaterial).opacity = 1;
      satellites.forEach(({ mesh }) => {
        mesh.scale.setScalar(1);
        (mesh.material as THREE.MeshBasicMaterial).opacity = 1;
      });
      lines.forEach((line) => ((line.material as THREE.LineBasicMaterial).opacity = 0.42));
      return;
    }
    gsap.to(hub.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out(1.6)" });
    gsap.to(hub.material, { opacity: 1, duration: 0.5 });
    satellites.forEach(({ mesh }, i) => {
      const delay = 0.25 + i * 0.09;
      gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.55, delay, ease: "back.out(1.7)" });
      gsap.to(mesh.material, { opacity: 1, duration: 0.45, delay });
      gsap.to(lines[i].material, { opacity: 0.42, duration: 0.5, delay: delay - 0.1 });
    });
  };

  hub.scale.setScalar(reduceMotion ? 1 : 0.001);
  (hub.material as THREE.MeshBasicMaterial).opacity = reduceMotion ? 1 : 0;

  let visible = true;
  new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        visible = e.isIntersecting;
        if (e.isIntersecting) play();
      }),
    { threshold: 0.35 },
  ).observe(host);

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    if (!reduceMotion && played) {
      const t = performance.now() * 0.0012;
      satellites.forEach(({ mesh, baseX, baseY }, i) => {
        const bob = Math.sin(t + i * 1.7) * 0.035;
        mesh.position.set(baseX * (1 + bob * 0.06), baseY + bob, 0);
      });
      packets.forEach((p, i) => {
        p.t = (p.t + 0.0045) % 1;
        const { baseX, baseY } = satellites[i];
        // out to the satellite, then back to the hub, on a loop
        const leg = p.t < 0.5 ? p.t * 2 : 2 - p.t * 2;
        p.sprite.position.set(baseX * leg, baseY * leg, 0);
        (p.sprite.material as THREE.SpriteMaterial).opacity = Math.sin(leg * Math.PI) * 0.6;
      });
    }
    renderer.render(scene, camera);
  };
  tick();
}
