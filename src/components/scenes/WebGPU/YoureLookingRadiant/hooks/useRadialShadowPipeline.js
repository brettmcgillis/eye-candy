/* eslint-disable no-param-reassign */
import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import writeArgyle from '../utils/argyle';
import createRadiancePipeline from '../utils/createPipeline';
import writeFibonacci from '../utils/fibonacci';
import { MAX_BODIES, MAX_LIGHTS, updateSceneUniforms } from '../utils/sceneTSL';
import createSwarm from '../utils/swarm';

const MAX_DELTA = 1 / 30;

// Two passes per frame, exactly as CrossTalk's radiance preset does it: an
// offscreen pass fills the 1D shadow map for every emitting particle, then the
// visible quad's compose material reads it back. Runs at useFrame priority 1
// because an offscreen pass has to be its own complete renderer.render call,
// so we own the frame and do the real scene render last.
function countRefractors(buffers, count) {
  let total = 0;

  for (let i = 0; i < count; i += 1) {
    if (buffers.bodies[i].refract > 0.5) total += 1;
  }

  return total;
}

export default function useRadiancePipeline(config) {
  const { camera, gl, scene, size } = useThree();
  const aspect = size.width / size.height;

  const live = useRef(config);
  live.current = config;

  const swarm = useMemo(
    () =>
      createSwarm({
        aspect,
        count: Math.min(config.particleCount, MAX_BODIES),
        seed: config.seed,
      }),
    // Deliberately not keyed on aspect: that would reseed the swarm on every
    // window resize. The live aspect goes in through setAspect instead.
    [config.particleCount, config.seed]
  );

  const stable = useMemo(() => createRadiancePipeline(), []);

  useEffect(
    () => () => {
      stable.shadowTarget.dispose();
      stable.shadowMaterial.dispose();
      stable.composeMaterial.dispose();
      stable.passMesh.geometry.dispose();
    },
    [stable]
  );

  // Palette colours differ in luminance by up to ~3.5x, so at one Light
  // Output a violet emitter genuinely puts out a third of what a cyan one
  // does — it reads as "that colour isn't emissive". Match Brightness scales
  // each toward the palette's mean luminance so intensity means the same
  // thing whatever the hue.
  const palette = useMemo(() => {
    const colors = [
      config.colorA,
      config.colorB,
      config.colorC,
      config.colorD,
    ].map((hex) => new THREE.Color(hex));

    const luminance = colors.map(
      (c) => c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722
    );
    const mean = luminance.reduce((a, b) => a + b, 0) / luminance.length;

    return colors.map((color, i) => {
      const scale = luminance[i] > 1e-4 ? mean / luminance[i] : 1;
      return color.multiplyScalar(1 + (scale - 1) * config.matchBrightness);
    });
  }, [
    config.colorA,
    config.colorB,
    config.colorC,
    config.colorD,
    config.matchBrightness,
  ]);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  useFrame((state, delta) => {
    const c = live.current;

    swarm.setAspect(aspect);
    swarm.step(Math.min(delta, MAX_DELTA), state.clock.elapsedTime, {
      ...c,
      pointerX: (state.pointer.x * 0.5 + 0.5) * aspect,
      pointerY: (1 - state.pointer.y) * 0.5,
    });

    // The sim works in field units (height 1) so every size control is
    // resolution independent; the shadow march works in pixels so CrossTalk's
    // tuned step sizes carry over unchanged.
    const swarmCounts = swarm.writeScene(
      stable.buffers,
      c,
      paletteRef.current,
      size.height,
      MAX_LIGHTS
    );
    const layers = { aspect, scale: size.height };
    const fibCounts = writeFibonacci(stable.buffers, swarmCounts, c, {
      ...layers,
      maxBodies: MAX_BODIES,
      maxLights: MAX_LIGHTS,
      time: state.clock.elapsedTime,
    });
    const counts = writeArgyle(stable.buffers, fibCounts, c, {
      aspect,
      maxBodies: MAX_BODIES,
      maxLights: MAX_LIGHTS,
      scale: size.height,
      time: state.clock.elapsedTime,
    });

    updateSceneUniforms(stable.sceneUniforms, stable.buffers, counts);

    const { growth } = stable;
    growth.uniforms.fieldSize.value.set(size.width, size.height);
    growth.uniforms.feedRate.value = c.growthFeed;
    growth.uniforms.killRate.value = c.growthKill;
    growth.uniforms.feedBias.value = c.growthFeedBias;
    growth.uniforms.seedRadius.value = c.growthSeedRadius;
    growth.uniforms.seedClear.value = c.growthClear;
    // Gray-Scott sustains itself, so seeding every frame is what pinned the
    // pattern to the lights: it could only ever grow where they were, and each
    // one ended up in its own little room. Pulsing instead lets the pattern
    // establish somewhere and spread on its own while the swarm moves through
    // what it left behind.
    const beat = Math.floor(state.clock.elapsedTime / c.growthSeedInterval);
    const pulsed = beat !== stable.growthBeat;

    if (pulsed) stable.growthBeat = beat;

    const seeding = c.growthEnabled && pulsed;

    growth.uniforms.seedStrength.value = seeding ? c.growthSeed : 0;
    growth.uniforms.seedPulse.value = seeding ? 1 : 0;
    growth.uniforms.stepScale.value = c.growthRate;
    growth.uniforms.threshold.value = c.growthThreshold;
    // Gray-Scott is only stable up to a point; a long frame must not be handed
    // to it whole or the field blows out and never recovers.

    growth.uniforms.enabled.value = c.growthEnabled ? 1 : 0;

    if (c.growthEnabled) growth.dispatch(gl);

    if (stable.shadowTarget.width !== c.shadowRays) {
      stable.shadowTarget.setSize(c.shadowRays, MAX_LIGHTS);
    }

    stable.origin.value.set(size.width * 0.5, size.height * 0.5);
    stable.viewSize.value.set(size.width, size.height);
    stable.ambient.value = c.ambient;
    stable.exposure.value = c.exposure;
    stable.lightStrength.value = c.lightStrength;
    stable.softness.value = c.shadowSoftness;
    stable.fieldColor.value.set(c.fieldColor);
    stable.bodyTint.value.set(c.bodyTint);

    const previousTarget = gl.getRenderTarget?.() ?? null;

    stable.passMesh.material = stable.shadowMaterial;
    gl.setRenderTarget(stable.shadowTarget);
    gl.render(stable.passScene, stable.passCamera);

    stable.refractIor.value = c.refractIor;
    stable.refractDepth.value = c.refractDepth;
    stable.refractDispersion.value = c.refractDispersion;
    stable.refractReflect.value = c.refractReflect;

    // Only pay for the second pass when something is actually bending light.
    if (countRefractors(stable.buffers, counts.bodyCount) === 0) {
      gl.setRenderTarget(previousTarget);
      gl.render(scene, camera);
      return;
    }

    if (stable.litTarget.width !== size.width) {
      stable.litTarget.setSize(size.width, size.height);
    }

    gl.setRenderTarget(stable.litTarget);
    gl.render(scene, camera);

    stable.passMesh.material = stable.refractMaterial;
    gl.setRenderTarget(previousTarget);
    gl.render(stable.passScene, stable.refractCamera);
  }, 1);

  return stable.composeMaterial;
}
