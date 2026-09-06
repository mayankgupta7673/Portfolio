import * as THREE from "three";
import { createBloom } from "./bloom";
import { getIconTexture } from "./iconTexture";

// The real stack — cloud platforms first (multi-cloud), then languages/frameworks,
// then delivery/AI tooling. Every icon here corresponds to a skill listed in #skills.
const ICONS = [
  "/icons/azure.svg",
  "/icons/aws.svg",
  "/icons/dotnet.svg",
  "/icons/nodejs.svg",
  "/icons/typescript.svg",
  "/icons/react.svg",
  "/icons/python.svg",
  "/icons/docker.svg",
  "/icons/github.svg",
  "/icons/cicd.svg",
  "/icons/apim.svg",
  "/icons/ai.svg",
  "/icons/data.svg",
  "/icons/monitoring.svg",
  "/icons/apps.svg",
];

/**
 * A cylinder of tech-stack icons orbiting a central glowing core — spins continuously
 * and accelerates with scroll, so it reads as an endless gallery of the stack.
 */
export function initRingGallery(): { setScroll(v: number): void } | null {
  const host = document.querySelector<HTMLElement>("[data-ring]");
  if (!host) return null;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 0.1, 9.4);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  // Bloom on the glowing core — the icon textures opt out below so they stay
  // crisp instead of blowing out under the tone-mapping bloom needs.
  const bloom = createBloom(renderer, scene, camera, { strength: 0.55, radius: 0.5, threshold: 0.45 });

  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const glow = new THREE.PointLight(0x63d6f7, 90, 40);
  glow.position.set(0, 0, 0);
  scene.add(glow);

  const ring = new THREE.Group();
  scene.add(ring);

  // Central core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 1),
    new THREE.MeshStandardMaterial({
      color: 0x2b8ae0,
      emissive: 0x1c6cb8,
      emissiveIntensity: 0.55,
      metalness: 0.4,
      roughness: 0.3,
    }),
  );
  scene.add(core);

  const RADIUS = 4.6;
  const total = ICONS.length * 2; // two stacked rows for density

  for (let i = 0; i < total; i++) {
    const src = ICONS[i % ICONS.length];
    const angle = (i / total) * Math.PI * 2;
    const row = i % 2 === 0 ? 1 : -1;

    const tex = getIconTexture(src);

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.55, 1.55),
      // toneMapped: false keeps the icon art at its original brightness — only
      // the emissive core and point light should read as "glowing".
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, toneMapped: false }),
    );
    plane.position.set(Math.cos(angle) * RADIUS, row * 0.95, Math.sin(angle) * RADIUS);
    plane.lookAt(0, row * 0.95, 0);
    ring.add(plane);
  }

  const VFOV_RAD = THREE.MathUtils.degToRad(48);
  const BASE_Z = 9.4;
  // Reference aspect the ring was framed for; narrower (portrait/mobile) viewports
  // give a much narrower horizontal FOV at the same vertical FOV, which is what
  // made the icons blow up and spill off-screen on phones.
  const REF_ASPECT = 16 / 9;
  const hFov = (aspect: number) => 2 * Math.atan(Math.tan(VFOV_RAD / 2) * aspect);
  const refHFov = hFov(REF_ASPECT);

  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    bloom.setSize(rect.width, rect.height);
    const aspect = rect.width / rect.height;
    camera.aspect = aspect;
    // Only pull the camera back for aspects narrower than the reference (portrait/
    // mobile) — clamping to 1 leaves anything at-or-wider-than 16:9 (all normal
    // desktop viewports) at the original, already-correct BASE_Z distance.
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

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let scroll = 0;

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    if (!reduceMotion) {
      ring.rotation.y += 0.0016;
      core.rotation.y += 0.004;
      core.rotation.x += 0.002;
    }
    camera.position.y = 0.35 - scroll * 0.45;
    camera.lookAt(0, 0, 0);
    bloom.render();
  };
  tick();

  return {
    setScroll(v: number) {
      scroll = v;
      ring.rotation.y = v * Math.PI * 1.6;
    },
  };
}
