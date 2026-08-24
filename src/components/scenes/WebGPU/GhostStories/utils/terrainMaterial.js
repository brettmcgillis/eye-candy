/* eslint-disable camelcase */
import { attribute, mix, mx_noise_float, positionWorld, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// One material instance is shared by every terrain chunk. Colors live in
// uniforms (owned by Terrain.jsx and synced from controls) so tint tweaks
// never rebuild geometry or shaders. The per-vertex `mask` attribute
// carries (path, shore) factors baked by buildTerrainChunk.
export default function createTerrainMaterial(uniforms) {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 1,
  });

  const mask = attribute('mask', 'vec2');

  // Large-scale mottling breaks up the flat meadow color under moonlight.
  const mottle = mx_noise_float(
    vec3(positionWorld.x.mul(0.08), 0, positionWorld.z.mul(0.08))
  )
    .mul(0.5)
    .add(0.5);

  const meadow = mix(
    uniforms.groundColor,
    uniforms.groundColorAlt,
    mottle.mul(0.75)
  );
  const withPath = mix(meadow, uniforms.pathColor, mask.x.clamp(0, 1));
  const withShore = mix(withPath, uniforms.shoreColor, mask.y.clamp(0, 1));

  material.colorNode = withShore;

  return material;
}
