import { chromium } from "playwright";
import { writeFileSync } from "fs";

/**
 * Lifts the studio portrait off its warm beige backdrop so it can sit on the site's
 * azure palette instead.
 *
 * Uses an edge flood-fill rather than a global colour key: only beige that is
 * *connected to the border* is removed, so his skin (which is interior, and only
 * ~52 away in RGB from the background) can never be keyed out by accident.
 */
const b = await chromium.launch({ channel: "msedge" });
const p = await b.newPage();
await p.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });

const dataUrl = await p.evaluate(async () => {
  const img = new Image();
  img.src = "/images/profile.jpeg";
  await img.decode();

  const OUT_W = 1000;
  const scale = OUT_W / img.naturalWidth;
  const W = OUT_W;
  const H = Math.round(img.naturalHeight * scale);

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);

  const imgData = ctx.getImageData(0, 0, W, H);
  const d = imgData.data;

  // reference background colours sampled around the border
  const refs = [];
  const sample = (x, y) => {
    const i = (y * W + x) * 4;
    refs.push([d[i], d[i + 1], d[i + 2]]);
  };
  // The blazer runs off the bottom of the frame, so the bottom border is NOT safe to
  // sample — taking navy from there would make the whole jacket count as background.
  // Sample the top edge, and only the upper part of the side edges.
  for (let x = 2; x < W; x += Math.floor(W / 16)) sample(x, 2);
  for (let y = 2; y < H * 0.55; y += Math.floor(H / 16)) {
    sample(2, Math.round(y));
    sample(W - 3, Math.round(y));
  }
  // and keep only genuinely beige references, as a second guard
  const beige = refs.filter(([r, g, bl]) => r > 150 && r - bl > 22 && r >= g && g >= bl);
  refs.length = 0;
  refs.push(...(beige.length ? beige : [[203, 177, 160]]));

  const TOL = 40;
  const isBg = (i) => {
    const r = d[i], g = d[i + 1], bl = d[i + 2];
    for (const [rr, gg, bb] of refs) {
      const dr = r - rr, dg = g - gg, db = bl - bb;
      if (dr * dr + dg * dg + db * db < TOL * TOL) return true;
    }
    return false;
  };

  // flood fill inward from every border pixel
  const mask = new Uint8Array(W * H); // 1 = background
  const stack = [];
  for (let x = 0; x < W; x++) {
    stack.push(x, 0, x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    stack.push(0, y, W - 1, y);
  }
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const idx = y * W + x;
    if (mask[idx]) continue;
    if (!isBg(idx * 4)) continue;
    mask[idx] = 1;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  // alpha from mask, then a small box blur on alpha to feather the cut edge
  const alpha = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = mask[i] ? 0 : 255;

  const RAD = 2;
  const blurred = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sum = 0, count = 0;
      for (let dy = -RAD; dy <= RAD; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= H) continue;
        for (let dx = -RAD; dx <= RAD; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= W) continue;
          sum += alpha[yy * W + xx];
          count++;
        }
      }
      blurred[y * W + x] = sum / count;
    }
  }

  for (let i = 0; i < W * H; i++) {
    const a = blurred[i];
    d[i * 4 + 3] = a;
    // pull residual beige fringe out of semi-transparent edge pixels
    if (a > 0 && a < 250) {
      d[i * 4] = Math.max(0, d[i * 4] - 12);
      d[i * 4 + 1] = Math.max(0, d[i * 4 + 1] - 6);
    }
  }
  ctx.putImageData(imgData, 0, 0);

  let removed = 0;
  for (let i = 0; i < W * H; i++) if (mask[i]) removed++;
  return { url: c.toDataURL("image/png"), removedPct: Math.round((removed / (W * H)) * 100), W, H };
});

writeFileSync("public/images/profile-cutout.png", Buffer.from(dataUrl.url.split(",")[1], "base64"));
console.log(`cutout written: ${dataUrl.W}x${dataUrl.H}, ${dataUrl.removedPct}% removed as background`);
await b.close();
