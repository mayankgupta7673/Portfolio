import * as THREE from "three";

/**
 * SVGs are rasterised onto a canvas before becoming a texture: THREE.TextureLoader
 * uploads them through an <img>, which frequently yields a blank texture for SVG
 * sources. Cached per URL + size so the same icon reused across scenes (ring
 * gallery, architecture diagram, skill constellation) only decodes once.
 */
const cache = new Map<string, THREE.CanvasTexture>();

export function getIconTexture(src: string, size = 512): THREE.CanvasTexture {
  const key = `${src}@${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

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

  cache.set(key, texture);
  return texture;
}
