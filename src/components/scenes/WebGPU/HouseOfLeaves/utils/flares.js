import * as THREE from 'three/webgpu';

// A hard cap, because every live flare is a loop iteration in the fog march.
export const MAX_FLARES = 16;

// Flares are the only human trace in the piece — somebody was here, and left.
// They have two jobs that must agree: lighting the stone, and scattering in
// the volume. The registry is what keeps them agreeing, packing whatever is
// currently mounted into one texture the march can read.
export default function createFlareRegistry() {
  const data = new Float32Array(MAX_FLARES * 4);
  const texture = new THREE.DataTexture(
    data,
    MAX_FLARES,
    1,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const entries = new Set();

  return {
    texture,
    entries,
    add(entry) {
      entries.add(entry);
      return () => entries.delete(entry);
    },
    // Packed from index 0 with no gaps, so the march can stop at the first
    // empty slot instead of always running the full loop.
    pack() {
      data.fill(0);
      let i = 0;
      entries.forEach((entry) => {
        if (i >= MAX_FLARES || entry.intensity <= 0) return;
        const o = i * 4;
        data[o] = entry.position.x;
        data[o + 1] = entry.position.y;
        data[o + 2] = entry.position.z;
        data[o + 3] = entry.intensity;
        i += 1;
      });
      texture.needsUpdate = true;
      return i;
    },
    dispose() {
      texture.dispose();
      entries.clear();
    },
  };
}
