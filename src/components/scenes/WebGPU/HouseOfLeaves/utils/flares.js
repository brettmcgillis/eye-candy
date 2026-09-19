import * as THREE from 'three/webgpu';

// A hard cap, because every live flare is a loop iteration in the fog march.
export const MAX_FLARES = 16;

// Small lights the volumetric has to know about: the road flares somebody
// left, and the warm doorway at the end of the way back. They have two jobs
// that must agree — lighting the stone, and scattering in the volume — and
// the registry is what keeps them agreeing, packing whatever is currently
// mounted into one texture the march can read: position and intensity on
// the first row, colour on the second.
export default function createFlareRegistry() {
  const data = new Float32Array(MAX_FLARES * 4 * 2);
  const texture = new THREE.DataTexture(
    data,
    MAX_FLARES,
    2,
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
        const c = MAX_FLARES * 4 + i * 4;
        data[c] = entry.color.r;
        data[c + 1] = entry.color.g;
        data[c + 2] = entry.color.b;
        data[c + 3] = entry.scatter ?? 1;
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
