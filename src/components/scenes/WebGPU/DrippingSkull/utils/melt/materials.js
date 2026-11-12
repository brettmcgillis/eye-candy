import {
  mix,
  mx_noise_float as mxNoiseFloat,
  positionLocal,
  smoothstep,
  uniform,
} from 'three/tsl';
import { Color, MeshPhysicalNodeMaterial } from 'three/webgpu';

export default function createMaterial(nodes, { wet = false } = {}) {
  const material = new MeshPhysicalNodeMaterial();
  const u = {
    color: uniform(new Color()),
    dry: uniform(0.06),
    wet: uniform(0.03),
    roughNoise: uniform(0.012),
  };
  const wetness = wet ? 1 : smoothstep(0.0005, 0.006, nodes.height);
  material.positionNode = nodes.position;
  material.normalNode = nodes.normal;
  material.colorNode = u.color;
  material.roughnessNode = mix(u.dry, u.wet, wetness).add(
    mxNoiseFloat(positionLocal.mul(19)).mul(u.roughNoise)
  );
  return {
    material,
    sync(config) {
      u.color.value.set(config.liquidColor);
      u.dry.value = config.meltDryRoughness;
      u.wet.value = config.roughness;
      material.metalness = config.metalness;
      material.clearcoat = config.clearcoat;
      material.clearcoatRoughness = config.clearcoatRoughness;
      material.iridescence = config.iridescence;
      material.ior = config.ior;
      material.transmission = config.transmission;
      material.thickness = config.thickness;
      material.emissive.set(config.emissiveColor);
      material.emissiveIntensity = config.emissiveIntensity;
      material.envMapIntensity = config.envIntensity;
      const signature =
        (config.clearcoat > 0 ? 1 : 0) +
        (config.iridescence > 0 ? 2 : 0) +
        (config.transmission > 0 ? 4 : 0);
      if (material.userData.signature !== signature) {
        material.userData.signature = signature;
        material.needsUpdate = true;
      }
    },
  };
}
