import {
  Fn,
  cameraViewMatrix,
  float,
  instanceIndex,
  mix,
  normalize,
  positionView,
  smoothstep,
  uniform,
  uv,
  varying,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { WORLD_SCALE } from './domain';
import lightMarch, { LIGHT_MARCH_STEPS } from './lightMarch';

// A bigger budget means the same fluid is made of smaller particles.
export function densityLevel(particles) {
  return Math.max(particles / 8192, 1);
}

// The self-shadow follows the rig's key light rather than a control of its own,
// so moving the key moves the shadows inside the fluid with it.
function keyDirection(lighting) {
  const slot = lighting?.slots?.find(
    (candidate) => candidate.id === 'key' && candidate.enabled
  );
  return slot?.position ?? null;
}

const MODES = {
  Additive: {
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    threshold: 0.002,
    transparent: true,
  },
  Alpha: {
    blending: THREE.NormalBlending,
    depthWrite: false,
    threshold: 0.002,
    transparent: true,
  },
  Solid: {
    blending: THREE.NoBlending,
    depthWrite: true,
    threshold: 0.5,
    transparent: false,
  },
};

export default class FluidRenderer {
  constructor(simulator, sort) {
    this.simulator = simulator;
    this.sort = sort;
    this.mode = null;

    this.uniforms = {
      alphaThreshold: uniform(0.002),
      ambient: uniform(0.12),
      colorCold: uniform(new THREE.Color('#2b0b3a')),
      colorHot: uniform(new THREE.Color('#fff1c4')),
      colorWarm: uniform(new THREE.Color('#ff4a10')),
      diameter: uniform(1),
      emissive: uniform(2.2),
      gloss: uniform(24),
      heatBias: uniform(0),
      heatGain: uniform(1),
      heatGamma: uniform(1.4),
      lightDirection: uniform(new THREE.Vector3(0, -1, 0)),
      lightGain: uniform(1),
      maxPixels: uniform(96),
      opacity: uniform(1),
      pixelScale: uniform(400),
      rim: uniform(0),
      shading: uniform(1),
      shadowBias: uniform(1.5),
      shadowDensity: uniform(0.35),
      shadowSolid: uniform(1.2),
      shadowStep: uniform(1),
      softness: uniform(0.05),
      specular: uniform(0.6),
      speedHeat: uniform(0.35),
    };

    const material = new THREE.PointsNodeMaterial({
      depthTest: true,
      sizeAttenuation: false,
      toneMapped: false,
    });

    const tint = varying(vec3(0), 'vTint');
    const glow = varying(float(0), 'vGlow');
    const shade = varying(float(0), 'vShade');

    material.positionNode = Fn(() => {
      const { buffers, grid } = this.simulator;
      // Instances draw in buffer order, so reading through the sorted index list
      // *is* the back-to-front draw order the alpha modes need.
      const index = this.sort.order.element(instanceIndex).y.toUint();
      const position = buffers.positions.element(index).xyz.toConst('particle');
      const speed = buffers.velocities.element(index).xyz.length();

      const heat = buffers.extra
        .element(index)
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
      shade.assign(
        lightMarch({
          grid,
          marker: buffers.marker,
          origin: position,
          salt: index.toFloat().mul(0.6180339),
          uniforms: this.uniforms,
        })
      );

      return position;
    })();

    material.sizeNode = this.uniforms.diameter
      .mul(this.uniforms.pixelScale)
      .div(positionView.z.negate().max(0.01))
      .clamp(0, this.uniforms.maxPixels);

    material.alphaTestNode = this.uniforms.alphaThreshold;

    material.colorNode = Fn(() => {
      const offset = uv().sub(0.5).mul(2).toConst('offset');
      const radial = offset.dot(offset).toConst('radial');
      const depth = radial.oneMinus().max(0).sqrt().toConst('depth');

      const shape = smoothstep(
        float(1).sub(this.uniforms.softness),
        1,
        radial
      ).oneMinus();

      // Sphere impostor: the quad's disc carries the normal a real sphere would
      // show, so `shading` slides between a flat puff and a lit bead without
      // changing the geometry.
      const normal = vec3(offset, depth);
      const toLight = normalize(
        cameraViewMatrix.mul(vec4(this.uniforms.lightDirection.negate(), 0)).xyz
      );
      const lambert = mix(
        float(1),
        normal.dot(toLight).max(0),
        this.uniforms.shading
      );
      const halfway = normalize(toLight.add(vec3(0, 0, 1)));
      const specular = normal
        .dot(halfway)
        .max(0)
        .pow(this.uniforms.gloss)
        .mul(this.uniforms.specular)
        .mul(this.uniforms.shading)
        .mul(shade);
      const fresnel = depth
        .oneMinus()
        .pow(3)
        .mul(this.uniforms.rim)
        .mul(this.uniforms.shading);

      const received = shade
        .mul(lambert)
        .mul(this.uniforms.lightGain)
        .add(this.uniforms.ambient);

      const rgb = tint
        .mul(received.add(fresnel))
        .add(tint.mul(glow).mul(this.uniforms.emissive))
        .add(specular);

      return vec4(rgb, shape.mul(this.uniforms.opacity));
    })();

    this.object = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    this.object.count = 0;
    this.object.frustumCulled = false;
  }

  setMode(mode) {
    if (mode === this.mode) return;
    const next = MODES[mode] || MODES.Alpha;
    const { material } = this.object;
    material.blending = next.blending;
    material.depthWrite = next.depthWrite;
    material.transparent = next.transparent;
    material.needsUpdate = true;
    this.uniforms.alphaThreshold.value = next.threshold;
    this.mode = mode;
  }

  update(config, pixelHeight) {
    const u = this.uniforms;
    u.ambient.value = config.fluidAmbient;
    u.colorCold.value.set(config.fluidColorCold);
    u.colorHot.value.set(config.fluidColorHot);
    u.colorWarm.value.set(config.fluidColorWarm);
    u.emissive.value = config.fluidEmissive;
    u.gloss.value = config.fluidGloss;
    u.heatBias.value = config.heatBias;
    u.heatGain.value = config.heatGain;
    u.heatGamma.value = config.heatGamma;
    u.lightGain.value = config.fluidLightGain;
    u.maxPixels.value = config.particleMaxPixels;
    u.opacity.value = config.fluidOpacity;
    u.pixelScale.value = pixelHeight * 0.5;
    u.rim.value = config.fluidRim;
    u.shading.value = config.fluidShading;
    u.shadowBias.value = config.shadowBias;
    u.shadowDensity.value = config.shadowDensity;
    u.shadowSolid.value = config.shadowSolid;
    u.shadowStep.value = config.shadowReach / LIGHT_MARCH_STEPS;
    u.softness.value = Math.max(config.particleSoftness, 0.02);
    u.specular.value = config.fluidSpecular;
    u.speedHeat.value = config.speedHeat;

    u.diameter.value =
      (config.particleScale * 1.6 * WORLD_SCALE) /
      Math.cbrt(densityLevel(config.particles));

    // The march wants the direction light *travels*, which is the key light's
    // position reversed.
    const key = keyDirection(config.lighting);
    if (key) u.lightDirection.value.set(-key[0], -key[1], -key[2]).normalize();

    this.setMode(config.fluidRenderMode);
    this.object.count = config.particles;
    this.object.visible = config.showFluid;
  }

  dispose() {
    this.object.geometry.dispose();
    this.object.material.dispose();
  }
}
