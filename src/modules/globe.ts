import * as THREE from "three";

/**
 * A globe built entirely out of particles: an equirectangular world map is sampled to
 * decide where land is, and a particle is placed at every land point. Interactions:
 *  - drag to spin (with inertia)
 *  - particles scatter away from the pointer as it moves over the surface
 */
export function initGlobe(): void {
  const host = document.querySelector<HTMLElement>("[data-globe]");
  if (!host) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 7.4;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  const R = 2.6;

  // Soft equator ring + halo so the sphere reads even before you interact
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xf4faff, transparent: true, opacity: 0.5 }),
  );
  group.add(halo);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(R * 1.22, R * 1.235, 128),
    new THREE.MeshBasicMaterial({
      color: 0x63d6f7,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = Math.PI * 0.5;
  group.add(ring);

  // --- Region markers + arcs (drawn regardless of map load) ---
  const regions: [number, number][] = [
    [52.4, 4.9],
    [59.3, 18.1],
    [37.4, -79.0],
    [18.5, 73.9],
    [1.3, 103.8],
    [25.3, 55.3],
    [-33.9, 151.2],
    [-23.5, -46.6],
  ];
  const toVec = (lat: number, lon: number, r = R) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    );
  };

  const markerMat = new THREE.MeshBasicMaterial({ color: 0x2b4bf2 });
  const markerVecs = regions.map(([lat, lon]) => {
    const v = toVec(lat, lon, R * 1.04);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), markerMat);
    m.position.copy(v);
    group.add(m);
    const h = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0x2b4bf2, transparent: true, opacity: 0.2 }),
    );
    h.position.copy(v);
    group.add(h);
    return v;
  });

  for (let i = 0; i < markerVecs.length; i++) {
    const a = markerVecs[i];
    const b = markerVecs[(i + 1) % markerVecs.length];
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.45);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const arc = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(56)),
      new THREE.LineBasicMaterial({ color: 0x2b4bf2, transparent: true, opacity: 0.28 }),
    );
    group.add(arc);
  }

  // --- Particle state (filled once the land mask is sampled) ---
  let COUNT = 0;
  let home = new Float32Array(0);
  let live = new Float32Array(0);
  let offset = new Float32Array(0);
  let colors = new Float32Array(0);
  let points: THREE.Points | null = null;
  let posAttr: THREE.BufferAttribute | null = null;
  let colAttr: THREE.BufferAttribute | null = null;

  // Soft rounded-tile sprite: reads better than square points at this size
  const tileTexture = (() => {
    const S = 64;
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const ctx = c.getContext("2d");
    if (ctx) {
      const r = 14;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(r, 2);
      ctx.arcTo(S - 2, 2, S - 2, S - 2, r);
      ctx.arcTo(S - 2, S - 2, 2, S - 2, r);
      ctx.arcTo(2, S - 2, 2, 2, r);
      ctx.arcTo(2, 2, S - 2, 2, r);
      ctx.closePath();
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  const oceanCol = new THREE.Color("#b6d8ee");
  const landCol = new THREE.Color("#1c6cb8");
  const landCol2 = new THREE.Color("#63d6f7");

  const buildParticles = (isLand: (lat: number, lon: number) => boolean) => {
    const SAMPLES = 26000; // candidates; only land ones become particles
    const pos: number[] = [];
    const col: number[] = [];

    const toLatLon = (x: number, y: number, z: number) => ({
      lat: Math.asin(y) * (180 / Math.PI),
      lon: Math.atan2(z, x) * (180 / Math.PI),
    });
    const push = (x: number, y: number, z: number, c: THREE.Color, jitter: number) => {
      // a touch of radial jitter keeps any sampling pattern from reading as stripes
      const j = 1 + (Math.random() - 0.5) * jitter;
      pos.push(x * R * j, y * R * j, z * R * j);
      col.push(c.r, c.g, c.b);
    };

    // Land comes off a Fibonacci lattice — dense and even, so continents hold their shape.
    for (let i = 0; i < SAMPLES; i++) {
      const y = 1 - (i / (SAMPLES - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      const { lat, lon } = toLatLon(x, y, z);
      if (!isLand(lat, lon)) continue;
      push(x, y, z, Math.random() > 0.86 ? landCol2 : landCol, 0.012);
    }

    // Ocean is sampled uniformly at random rather than by skipping lattice points.
    // Skipping every Nth lattice point traces the underlying spiral, which is what
    // produced the visible arcs — random sampling has no structure to show through.
    const OCEAN = 7000;
    for (let k = 0; k < OCEAN; k++) {
      const y = 1 - 2 * Math.random();
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.random() * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      const { lat, lon } = toLatLon(x, y, z);
      if (isLand(lat, lon)) continue; // land already covered above
      push(x, y, z, oceanCol, 0.02);
    }

    COUNT = pos.length / 3;
    home = new Float32Array(pos);
    live = new Float32Array(pos);
    offset = new Float32Array(pos.length);
    colors = new Float32Array(col);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(live, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.115,
        map: tileTexture,
        alphaTest: 0.25,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        sizeAttenuation: true,
      }),
    );
    group.add(points);
    posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    colAttr = geo.getAttribute("color") as THREE.BufferAttribute;
  };

  // Sample the world map for land/ocean
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = "/images/world-map.jpg";
  img.onload = () => {
    const c = document.createElement("canvas");
    const W = 720;
    const H = 360;
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      buildParticles(() => true);
      return;
    }
    ctx.drawImage(img, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;

    buildParticles((lat, lon) => {
      const u = Math.floor(((lon + 180) / 360) * W) % W;
      const v = Math.floor(((90 - lat) / 180) * H);
      const idx = (v * W + Math.max(0, u)) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Ocean on this map is strongly blue-dominant; land is green/brown/white.
      return !(b > r + 12 && b > g + 6);
    });
  };
  img.onerror = () => buildParticles(() => true);

  // --- Pointer interaction ---
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(R, 24, 24),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  group.add(hitSphere);

  let hoverLocal: THREE.Vector3 | null = null;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let velX = reduceMotion ? 0 : 0.0024;
  let velY = 0;

  const SCATTER_RADIUS = 1.25;
  const SCATTER_STRENGTH = 0.62;

  const updatePointer = (clientX: number, clientY: number) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(hitSphere, false);
    hoverLocal = hits.length ? group.worldToLocal(hits[0].point.clone()) : null;
  };

  host.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  host.addEventListener("pointermove", (e) => {
    updatePointer(e.clientX, e.clientY);
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    velX = dx * 0.00035;
    velY = dy * 0.00035;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  host.addEventListener("pointerleave", () => (hoverLocal = null));
  host.addEventListener("pointerup", () => (dragging = false));
  host.addEventListener("pointercancel", () => (dragging = false));

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const size = Math.max(1, Math.min(rect.width, rect.height));
    renderer.setSize(size, size, false);
    camera.aspect = 1;
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

    if (!dragging) {
      velX += (0.0024 - velX) * 0.02;
      velY *= 0.94;
    }
    group.rotation.y += velX;
    group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + velY, -0.65, 0.65);

    if (points && posAttr && colAttr) {
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const hx = home[ix];
        const hy = home[ix + 1];
        const hz = home[ix + 2];

        let tx = 0;
        let ty = 0;
        let tz = 0;

        if (hoverLocal) {
          const dx = hx - hoverLocal.x;
          const dy = hy - hoverLocal.y;
          const dz = hz - hoverLocal.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < SCATTER_RADIUS) {
            const f = (1 - dist / SCATTER_RADIUS) * SCATTER_STRENGTH;
            const inv = 1 / (dist || 0.0001);
            tx += dx * inv * f;
            ty += dy * inv * f;
            tz += dz * inv * f;
          }
        }

        offset[ix] += (tx - offset[ix]) * 0.14;
        offset[ix + 1] += (ty - offset[ix + 1]) * 0.14;
        offset[ix + 2] += (tz - offset[ix + 2]) * 0.14;

        live[ix] = hx + offset[ix];
        live[ix + 1] = hy + offset[ix + 1];
        live[ix + 2] = hz + offset[ix + 2];

        colAttr.setXYZ(i, colors[ix], colors[ix + 1], colors[ix + 2]);
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }

    renderer.render(scene, camera);
  };
  tick();
}
