import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/**
 * Shared bloom setup for the ring gallery and globe scenes: a soft glow on
 * whatever's genuinely bright in each scene (the ring's emissive core, the
 * globe's cyan halo/arcs) without washing out everything else. UnrealBloomPass
 * expects tone mapping enabled on the renderer — without it, the additive
 * bloom composite just clips to flat white instead of falling off smoothly.
 */
export function createBloom(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  { strength = 0.5, radius = 0.45, threshold = 0.4 } = {},
) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), strength, radius, threshold));
  composer.addPass(new OutputPass());

  return {
    render: () => composer.render(),
    setSize: (width: number, height: number) => composer.setSize(width, height),
  };
}
