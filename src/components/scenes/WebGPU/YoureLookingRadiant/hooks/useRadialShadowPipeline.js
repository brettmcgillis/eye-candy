/* eslint-disable no-param-reassign */
import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import createRadiancePipeline from '../utils/createPipeline';
import { MAX_BODIES, updateSceneUniforms } from '../utils/sceneTSL';
import createSwarm from '../utils/swarm';

const MAX_DELTA = 1 / 30;

// Two passes per frame: an offscreen pass fills the 1D shadow map for every
// emitting particle, then the visible quad's compose material reads it back.
// Runs at useFrame priority 1 because an offscreen pass has to be its own
// complete renderer.render call, so we own the frame and do the real scene
// render last. Refractors add a third pass over the composed image.
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
      stable.litTarget.dispose();
      stable.shadowMaterial.dispose();
      stable.composeMaterial.dispose();
      stable.refractMaterial.dispose();
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
    // resolution independent; the shadow pass works in pixels.
    const counts = swarm.writeScene(
      stable.buffers,
      c,
      paletteRef.current,
      size.height
    );

    updateSceneUniforms(stable.sceneUniforms, stable.buffers, counts);

    if (stable.shadowTarget.width !== c.shadowRays) {
      stable.shadowTarget.setSize(c.shadowRays, stable.shadowTarget.height);
    }

    stable.origin.value.set(size.width * 0.5, size.height * 0.5);
    stable.viewSize.value.set(size.width, size.height);
    stable.ambient.value = c.ambient;
    stable.exposure.value = c.exposure;
    stable.lightStrength.value = c.lightStrength;
    stable.softness.value = c.shadowSoftness;
    stable.fieldColor.value.set(c.fieldColor);
    stable.bodyTint.value.set(c.bodyTint);
    stable.refractIor.value = c.refractIor;
    stable.refractDepth.value = c.refractDepth;
    stable.refractDispersion.value = c.refractDispersion;
    stable.refractReflect.value = c.refractReflect;

    const previousTarget = gl.getRenderTarget?.() ?? null;

    stable.passMesh.material = stable.shadowMaterial;
    gl.setRenderTarget(stable.shadowTarget);
    gl.render(stable.passScene, stable.passCamera);

    // Only pay for the third pass when something is actually bending light.
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
