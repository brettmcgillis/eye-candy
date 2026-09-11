import {
  Fn,
  float,
  instanceIndex,
  mix,
  positionGeometry,
  smoothstep,
  uniform,
  varying,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// A bigger budget means the same fluid is made of smaller particles.
export function densityLevel(particles) {
  return Math.max(particles / 8192, 1);
}

export default class FluidRenderer {
  constructor(simulator) {
    this.simulator = simulator;

    this.uniforms = {
      colorCold: uniform(new THREE.Color('#2b0b3a')),
      colorHot: uniform(new THREE.Color('#fff1c4')),
      colorWarm: uniform(new THREE.Color('#ff4a10')),
      emissive: uniform(2.2),
      heatBias: uniform(0),
      heatGain: uniform(1),
      heatGamma: uniform(1.4),
      size: uniform(1),
      speedHeat: uniform(0.35),
    };

    const material = new THREE.MeshStandardNodeMaterial({
      metalness: 0.1,
      roughness: 0.45,
    });

    const tint = varying(vec3(0), 'vTint');
    const glow = varying(float(0), 'vGlow');

    material.positionNode = Fn(() => {
      const { buffers } = this.simulator;
      const position = buffers.positions.element(instanceIndex).xyz;
      const speed = buffers.velocities.element(instanceIndex).xyz.length();

      const heat = buffers.extra
        .element(instanceIndex)
        .y.mul(this.uniforms.heatGain)
        .add(this.uniforms.heatBias)
        .add(speed.mul(this.uniforms.speedHeat))
        .clamp(0, 1)
        .pow(this.uniforms.heatGamma)
        .toConst('heat');

      tint.assign(
        mix(
          mix(
            this.uniforms.colorCold,
            this.uniforms.colorWarm,
            smoothstep(0, 0.55, heat)
          ),
          this.uniforms.colorHot,
          smoothstep(0.55, 1, heat)
        )
      );
      glow.assign(heat.mul(heat));

      return positionGeometry.mul(this.uniforms.size).add(position);
    })();

    material.colorNode = tint;
    material.emissiveNode = tint.mul(glow).mul(this.uniforms.emissive);

    this.object = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.5, 0),
      material
    );
    this.object.count = 0;
    this.object.frustumCulled = false;
  }

  update(config) {
    this.uniforms.colorCold.value.set(config.fluidColorCold);
    this.uniforms.colorHot.value.set(config.fluidColorHot);
    this.uniforms.colorWarm.value.set(config.fluidColorWarm);
    this.uniforms.emissive.value = config.fluidEmissive;
    this.uniforms.heatBias.value = config.heatBias;
    this.uniforms.heatGain.value = config.heatGain;
    this.uniforms.heatGamma.value = config.heatGamma;
    this.uniforms.size.value =
      (config.particleScale * 1.6) / Math.cbrt(densityLevel(config.particles));
    this.uniforms.speedHeat.value = config.speedHeat;
    this.object.count = config.particles;
    this.object.visible = config.showFluid;
  }

  dispose() {
    this.object.geometry.dispose();
    this.object.material.dispose();
  }
}
