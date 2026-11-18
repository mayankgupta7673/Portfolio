export default {
  build: {
    // three.js (~580 kB) is its own chunk, loaded lazily per 3D scene, so it can't shrink further.
    chunkSizeWarningLimit: 650,
  },
};
