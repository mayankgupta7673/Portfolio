import * as THREE from "three";
import { gsap } from "gsap";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * 3D character helper.
 *
 * Desktop  — trails the cursor, banks into turns, glances where you're heading.
 * Touch    — there is no cursor to follow, so it parks in the corner at a smaller
 *            size and reacts to scrolling instead: it leans into the scroll
 *            direction, bobs with momentum, and reacts when tapped. It can be
 *            dismissed, and it steps aside while the mobile menu is open.
 *
 * Skipped entirely under prefers-reduced-motion.
 */

const IDLE = "Idle";
const GREETING = "Wave";
const REACTIONS = ["ThumbsUp", "Jump", "Dance", "Yes", "Wave"];

export function initCompanion(): void {
  const host = document.querySelector<HTMLElement>("[data-companion]");
  if (!host) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    host.remove();
    return;
  }

  // Touch/narrow devices get the parked variant rather than nothing at all.
  const isTouch =
    window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 900px)").matches;

  const SIZE = isTouch ? 130 : 280;
  host.classList.toggle("companion--parked", isTouch);
  host.style.width = `${SIZE}px`;
  host.style.height = `${SIZE}px`;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 2.9, 12.2);
  camera.lookAt(0, 2.5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: !isTouch, alpha: true });
  // keep the pixel budget lower on phones
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
  renderer.setSize(SIZE, SIZE, false);
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xbdd6ee, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x38c6f4, 1.4);
  rim.position.set(-5, 2, -3);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  let mixer: THREE.AnimationMixer | null = null;
  const actions: Record<string, THREE.AnimationAction> = {};
  let current: THREE.AnimationAction | null = null;
  let model: THREE.Object3D | null = null;
  let reactionIndex = 0;
  let busyUntil = 0;

  const fadeTo = (name: string, duration = 0.3, loopOnce = false) => {
    const next = actions[name];
    if (!next || next === current) return;
    next.reset().setEffectiveWeight(1);
    if (loopOnce) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }
    next.fadeIn(duration).play();
    current?.fadeOut(duration);
    current = next;
  };

  const react = () => {
    if (!mixer || performance.now() < busyUntil) return;
    const name = REACTIONS[reactionIndex++ % REACTIONS.length];
    const action = actions[name];
    if (!action) return;
    fadeTo(name, 0.18, true);
    busyUntil = performance.now() + action.getClip().duration * 1000;
  };

  new GLTFLoader().load(
    "/models/character.glb",
    (gltf) => {
      model = gltf.scene;
      const hsl = { h: 0, s: 0, l: 0 };
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => {
          const c = (mat as THREE.MeshStandardMaterial).color;
          if (!c) return;
          c.getHSL(hsl);
          if (hsl.s > 0.25) c.setHSL(0.575, Math.min(0.85, hsl.s * 1.05), hsl.l * 0.96);
        });
      });

      const box = new THREE.Box3().setFromObject(model);
      model.position.y -= box.min.y;
      group.add(model);

      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => (actions[clip.name] = mixer!.clipAction(clip)));
      fadeTo(IDLE, 0);
      if (actions[GREETING]) {
        window.setTimeout(() => {
          fadeTo(GREETING, 0.2, true);
          busyUntil = performance.now() + actions[GREETING].getClip().duration * 1000;
        }, 1400);
      }
      mixer.addEventListener("finished", () => fadeTo(IDLE, 0.28));
      gsap.to(host, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" });
    },
    undefined,
    () => host.remove(),
  );

  let targetTurn = 0;
  let targetLean = 0;
  let targetPitch = 0;

  if (!isTouch) {
    // --- Desktop: trail the cursor ---
    gsap.set(host, { opacity: 0, scale: 0.6, xPercent: -50, yPercent: -50 });
    const moveX = gsap.quickTo(host, "x", { duration: 0.85, ease: "power3.out" });
    const moveY = gsap.quickTo(host, "y", { duration: 0.95, ease: "power3.out" });
    let lastX = window.innerWidth / 2;
    let lastY = window.innerHeight / 2;

    window.addEventListener("pointermove", (e) => {
      moveX(e.clientX + 150);
      moveY(e.clientY + 110);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > 1) {
        targetTurn = THREE.MathUtils.clamp(dx * 0.05, -0.9, 0.9);
        targetLean = THREE.MathUtils.clamp(-dx * 0.03, -0.45, 0.45);
      }
      if (Math.abs(dy) > 1) targetPitch = THREE.MathUtils.clamp(dy * 0.02, -0.3, 0.3);
      lastX = e.clientX;
      lastY = e.clientY;
    });
  } else {
    // --- Touch: parked in the corner, driven by scroll instead of a cursor ---
    gsap.set(host, { opacity: 0, scale: 0.6 });
    let lastScroll = window.scrollY;

    // dismiss control, so it can never sit on top of something you're trying to read
    const close = document.createElement("button");
    close.className = "companion-close";
    close.setAttribute("aria-label", "Hide the assistant");
    close.textContent = "×";
    close.addEventListener("click", (e) => {
      e.stopPropagation();
      gsap.to(host, {
        opacity: 0,
        scale: 0.5,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => host.remove(),
      });
    });
    host.appendChild(close);

    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        const dy = y - lastScroll;
        lastScroll = y;
        // lean into the scroll direction and spin slightly with momentum
        targetLean = THREE.MathUtils.clamp(dy * 0.012, -0.4, 0.4);
        targetTurn = THREE.MathUtils.clamp(dy * 0.01, -0.7, 0.7);
        targetPitch = THREE.MathUtils.clamp(-dy * 0.006, -0.25, 0.25);
      },
      { passive: true },
    );

    // step aside while the mobile menu is open
    const mobileNav = document.querySelector("[data-mobile-nav]");
    if (mobileNav) {
      new MutationObserver(() => {
        const open = mobileNav.classList.contains("is-open");
        gsap.to(host, { opacity: open ? 0 : 1, duration: 0.25 });
      }).observe(mobileNav, { attributes: true, attributeFilter: ["class"] });
    }
  }

  host.addEventListener("click", react);

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
    mixer?.update(nextDelta());
    if (model) {
      targetTurn *= 0.93;
      targetLean *= 0.9;
      targetPitch *= 0.9;
      group.rotation.y += (targetTurn - group.rotation.y) * 0.09;
      group.rotation.z += (targetLean - group.rotation.z) * 0.09;
      group.rotation.x += (targetPitch - group.rotation.x) * 0.09;
      group.position.y = Math.sin(performance.now() * 0.0016) * 0.1;
    }
    renderer.render(scene, camera);
  };
  tick();
}
