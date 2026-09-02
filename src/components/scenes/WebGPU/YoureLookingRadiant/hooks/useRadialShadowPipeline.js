import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import createRadiancePipeline from '../utils/createPipeline';
import { MAX_BODIES, MAX_LIGHTS, updateSceneUniforms } from '../utils/sceneTSL';
import createSwarm from '../utils/swarm';

const MAX_DELTA = 1 / 30;

// Two passes per frame, exactly as CrossTalk's radiance preset does it: an
// offscreen pass fills the 1D shadow map for every emitting particle, then the
// visible quad's compose material reads it back. Runs at useFrame priority 1
// because an offscreen pass has to be its own complete renderer.render call,
// so we own the frame and do the real scene render last.
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
    const counts = swarm.writeScene(
      stable.buffers,
      c,
      paletteRef.current,
      size.height,
      MAX_LIGHTS
    );
    updateSceneUniforms(stable.sceneUniforms, stable.buffers, counts);

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

    gl.setRenderTarget(stable.shadowTarget);
    gl.render(stable.passScene, stable.passCamera);

    gl.setRenderTarget(previousTarget);
    gl.render(scene, camera);
  }, 1);

  return stable.composeMaterial;
}
