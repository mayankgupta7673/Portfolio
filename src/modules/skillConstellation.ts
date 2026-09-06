import * as THREE from "three";
import { getIconTexture } from "./iconTexture";

/**
 * The six skill categories from #skills, as a small node graph in real 3D
 * space rather than a flat grid — lives as a quiet background presence in the
 * footer (left of the coder illustration), so it never adds scroll length of
 * its own. Drag to rotate; drifts slowly on its own otherwise.
 */
const NODES: { icon: string; pos: [number, number, number] }[] = [
  { icon: "/icons/functions.svg", pos: [-1.05, 0.4, 0.3] },
  { icon: "/icons/ai.svg", pos: [0.85, 0.65, -0.35] },
  { icon: "/icons/cicd.svg", pos: [1.1, -0.45, 0.45] },
  { icon: "/icons/dotnet.svg", pos: [-0.75, -0.75, -0.2] },
  { icon: "/icons/apps.svg", pos: [0.1, -1.0, 0.55] },
  { icon: "/icons/data.svg", pos: [-0.2, 1.0, -0.45] },
];
const LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 5],
  [2, 3],
  [3, 4],
  [4, 5],
  [0, 3],
];

export function initSkillConstellation(): void {
  const host = document.querySelector<HTMLElement>("[data-skill-constellation]");
  if (!host) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4.6;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  const group = new THREE.Group();
  scene.add(group);

  // Bright cyan reads well here — this sits on the footer's dark background,
  // unlike the page's light sections where this same colour would wash out.
  const lineMat = new THREE.LineBasicMaterial({ color: 0x63d6f7, transparent: true, opacity: 0.3 });
  LINKS.forEach(([ai, bi]) => {
    const a = new THREE.Vector3(...NODES[ai].pos);
    const b = new THREE.Vector3(...NODES[bi].pos);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat);
    group.add(line);
  });

  NODES.forEach(({ icon, pos }) => {
    const tex = getIconTexture(icon);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.46),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthTest: false }),
    );
    mesh.position.set(...pos);
    group.add(mesh);
  });

  // This lives in a footer column capped at a fixed width but full footer
  // height (see .skill-constellation in layout.css) — unlike a heading band,
  // the footer's height comes from real text content and isn't guaranteed to
  // stay wide, so the same narrow-aspect camera pull-back as the ring gallery
  // applies here too (see ringGallery.ts for the full reasoning).
  const VFOV_RAD = THREE.MathUtils.degToRad(45);
  const REF_ASPECT = 1;
  const hFov = (aspect: number) => 2 * Math.atan(Math.tan(VFOV_RAD / 2) * aspect);
  const refHFov = hFov(REF_ASPECT);
  const BASE_Z = 3.6;

  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    const aspect = rect.width / rect.height;
    camera.aspect = aspect;
    camera.position.z = BASE_Z * Math.max(1, refHFov / hFov(aspect));
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  let visible = true;
  new IntersectionObserver(
    (entries) => entries.forEach((e) => (visible = e.isIntersecting)),
    { threshold: 0 },
  ).observe(host);

  // Drag to rotate, with inertia — same model as the globe.
  let dragging = false;
  let lastX = 0;
  let velY = reduceMotion ? 0 : 0.0018;

  host.style.cursor = "grab";
  host.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    host.style.cursor = "grabbing";
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    velY = dx * 0.004;
    lastX = e.clientX;
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
    host.style.cursor = "grab";
  });

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    // While dragging, pointermove already drives velY directly; once released,
    // ease it back toward the slow idle auto-rotate speed for a settling feel.
    if (!dragging) {
      velY += ((reduceMotion ? 0 : 0.0018) - velY) * 0.02;
    }
    group.rotation.y += velY;
    renderer.render(scene, camera);
  };
  tick();
}
