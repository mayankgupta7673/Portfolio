import * as THREE from "three";

/**
 * A small soft radial-glow texture, drawn once and shared by every additive
 * "packet" or "node" sprite across the hero flow, architecture diagram and
 * skill constellation scenes.
 */
let texture: THREE.CanvasTexture | null = null;

function getGlowTexture(): THREE.CanvasTexture {
  if (texture) return texture;
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(160,225,255,0.85)");
    g.addColorStop(1, "rgba(99,214,247,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }
  texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeGlowSprite(scale: number, opacity: number): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    transparent: true,
    opacity,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(scale, scale, 1);
  return s;
}

/**
 * Same soft dot, but alpha-blended and colour-tinted rather than additive —
 * additive blending only reads as a "glow" against a dark backdrop; on a
 * light page background it just disappears (adding light to near-white does
 * nothing visible). Use this variant for scenes that sit on light sections.
 */
export function makeTintedDot(color: number, scale: number, opacity: number): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color,
    transparent: true,
    opacity,
    depthTest: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(scale, scale, 1);
  return s;
}
