import * as THREE from 'three/webgpu';

// Shared by FloidsSwarm (per-instance glow/scale) and useGhostBroadcast
// (deciding which agents' flash state to mirror into sibling windows) so the
// two can't compute a different flash value for the same agent.
export default function flashIntensity(clock, cycle) {
  const phase = Math.abs(clock / cycle - 0.5);
  return THREE.MathUtils.smoothstep(0.18, 0.015, phase);
}
