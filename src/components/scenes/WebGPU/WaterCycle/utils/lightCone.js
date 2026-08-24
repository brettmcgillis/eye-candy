import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

export default function createLightCone() {
  const origin = uniform(new THREE.Vector3(0, 60, 0));
  const radius = uniform(9);
  const spread = uniform(0.42);
  const softness = uniform(1.8);
  const reach = uniform(95);
  const intensity = uniform(1.6);
  const ambient = uniform(0.08);

  const evaluate = (worldPosition) => {
    const offset = worldPosition.sub(origin);
    const depth = offset.y.negate().max(0);
    const coneRadius = radius.add(depth.mul(spread));
    const falloff = offset.xz
      .length()
      .div(coneRadius.max(0.001))
      .oneMinus()
      .saturate()
      .pow(softness);

    return ambient.add(
      falloff.mul(depth.div(reach).oneMinus().saturate()).mul(intensity)
    );
  };

  const applyConfig = (light, phase) => {
    if (!light) {
      return;
    }

    origin.value.set(
      light.x + Math.sin(phase) * light.driftRadius,
      light.height,
      light.z + Math.sin(phase * 0.73) * light.driftRadius
    );
    radius.value = light.radius;
    spread.value = light.spread;
    softness.value = light.softness;
    reach.value = light.reach;
    ambient.value = light.ambient;
    intensity.value =
      light.intensity * (1 + Math.sin(phase * 1.31) * light.pulse);
  };

  return { applyConfig, evaluate, origin };
}
