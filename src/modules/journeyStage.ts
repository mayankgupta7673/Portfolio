import * as THREE from "three";

export interface JourneyStage {
  setChapter(index: number): void;
  setScroll(progress: number): void;
}

/**
 * The 3D panel beside the pinned career story: a floating glass card showing the tech
 * icon for the current chapter. Swaps with a pop as chapters change and drifts with
 * scroll — real stack icons rather than abstract geometry.
 */
const ICONS = [
  "/icons/dotnet.svg", // 2018 foundations
  "/icons/migration.svg", // 2019 modernisation
  "/icons/cicd.svg", // 2021 pipelines
  "/icons/functions.svg", // 2022 azure functions
  "/icons/apim.svg", // 2024 integration platform
  "/icons/ai.svg", // now — agentic AI
];

export function initJourneyStage(): JourneyStage | null {
  const host = document.querySelector<HTMLElement>("[data-journey-stage]");
  if (!host) return null;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 9.2;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.PointLight(0x63d6f7, 90, 60);
  key.position.set(4, 5, 7);
  scene.add(key);
  const rim = new THREE.PointLight(0x8e78f2, 70, 60);
  rim.position.set(-6, -2, 4);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  // Glass card the icon sits on
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(2.9, 2.9, 0.2),
    new THREE.MeshPhysicalMaterial({
      color: 0x123a5e,
      metalness: 0.3,
      roughness: 0.28,
      clearcoat: 0.8,
      transparent: true,
      opacity: 0.92,
    }),
  );
  group.add(card);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.92, 2.92, 0.22)),
    new THREE.LineBasicMaterial({ color: 0x63d6f7, transparent: true, opacity: 0.55 }),
  );
  group.add(edge);

  // Icon plane, textured per chapter.
  // SVGs are rasterised onto a canvas first: TextureLoader uploads them through an
  // <img>, which frequently yields a blank texture for SVG sources.
  const makeIconTexture = (src: string) => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      texture.needsUpdate = true;
    };
    img.src = src;
    return texture;
  };
  const textures = ICONS.map(makeIconTexture);

  const iconMat = new THREE.MeshBasicMaterial({
    map: textures[0],
    transparent: true,
  });
  const icon = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), iconMat);
  icon.position.z = 0.115;
  group.add(icon);

  // Orbiting accent dots so the panel has life even between chapters
  const orbit = new THREE.Group();
  group.add(orbit);
  for (let i = 0; i < 3; i++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 14, 14),
      new THREE.MeshBasicMaterial({ color: i === 1 ? 0x8e78f2 : 0x63d6f7 }),
    );
    const a = (i / 3) * Math.PI * 2;
    dot.position.set(Math.cos(a) * 2.25, Math.sin(a) * 2.25, 0);
    orbit.add(dot);
  }

  let currentIndex = -1;
  let popT = 1;
  let scrollProgress = 0;

  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    // pull back on narrow columns so the card always sits inside the frame
    camera.position.z = rect.width < 460 ? 11.5 : 9.2;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  let visible = true;
  new IntersectionObserver(
    (entries) => entries.forEach((e) => (visible = e.isIntersecting)),
    { threshold: 0 },
  ).observe(host);

  // THREE.Clock is deprecated; track delta directly and clamp it so returning to a
  // backgrounded tab doesn't fast-forward the animation.
  let lastFrame = performance.now();
  const nextDelta = () => {
    const now = performance.now();
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    return dt;
  };
  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = nextDelta();

    if (popT < 1) popT = Math.min(1, popT + dt * 2.4);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const eased = 1 + c3 * Math.pow(popT - 1, 3) + c1 * Math.pow(popT - 1, 2);
    const scale = 0.55 + eased * 0.45;
    group.scale.setScalar(scale);

    if (!reduceMotion) {
      const t = performance.now() * 0.001;
      group.rotation.y = Math.sin(t * 0.5) * 0.18 + scrollProgress * 0.25;
      group.rotation.x = Math.sin(t * 0.35) * 0.08;
      group.position.y = Math.sin(t * 0.8) * 0.12;
      orbit.rotation.z += dt * 0.5;
    }

    renderer.render(scene, camera);
  };
  tick();

  return {
    setChapter(index: number) {
      if (index === currentIndex) return;
      currentIndex = index;
      iconMat.map = textures[index % textures.length];
      iconMat.needsUpdate = true;
      popT = 0;
    },
    setScroll(progress: number) {
      scrollProgress = progress;
    },
  };
}
