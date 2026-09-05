import * as THREE from "three";

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
 * SVGs are rasterised onto a canvas before becoming a texture: THREE.TextureLoader
 * uploads them through an <img>, which frequently yields a blank texture for SVG
 * sources (same issue fixed in journeyStage.ts). Cached per URL so the 15 icons
 * shown twice around the ring only decode once each.
 */
const textureCache = new Map<string, THREE.CanvasTexture>();
function getIconTexture(src: string): THREE.CanvasTexture {
  const cached = textureCache.get(src);
  if (cached) return cached;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    texture.needsUpdate = true;
  };
  img.src = src;

  textureCache.set(src, texture);
  return texture;
}

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
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true }),
    );
    plane.position.set(Math.cos(angle) * RADIUS, row * 0.95, Math.sin(angle) * RADIUS);
    plane.lookAt(0, row * 0.95, 0);
    ring.add(plane);
  }

  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
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
    renderer.render(scene, camera);
  };
  tick();

  return {
    setScroll(v: number) {
      scroll = v;
      ring.rotation.y = v * Math.PI * 1.6;
    },
  };
}
