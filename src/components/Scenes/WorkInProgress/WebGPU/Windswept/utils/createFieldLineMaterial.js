import { attribute, float, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Fade-by-vertex-age line material — same math as Weightless's
// createTrailMaterial fade curve, minus the skinning branch (field lines
// advect through free space, nothing to ride).
export default function createFieldLineMaterial({ color, opacity }) {
  const uniforms = {
    color: uniform(new THREE.Color(color)),
    currentSec: uniform(0),
    fadeSec: uniform(3),
    opacity: uniform(opacity),
  };

  const material = new THREE.LineBasicNodeMaterial({
    depthWrite: false,
    transparent: true,
  });

  const age = uniforms.currentSec.sub(attribute('creationSec', 'float'));
  const fade = float(1).sub(age.div(uniforms.fadeSec)).clamp(0, 1);

  material.colorNode = uniforms.color;
  material.opacityNode = uniforms.opacity.mul(fade);

  return { material, uniforms };
}
