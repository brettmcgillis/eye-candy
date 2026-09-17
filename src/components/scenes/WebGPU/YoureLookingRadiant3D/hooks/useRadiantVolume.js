import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { buildPalette, createSwarm, paletteKey } from '@modules/radiantSwarm';

import { MAX_BODIES, tileSizeFor, worldToField } from '../utils/constants';
import {
  createShadowStage,
  createStablePipeline,
} from '../utils/createPipeline';
import { packBodies, packCamera } from '../utils/volumeUniforms';

const MAX_DELTA = 1 / 30;

// Owns the frame at priority 1, like the flat scene: the atlas compute, the lit
// pass into a target, then glass and upscale to the screen.
export default function useRadiantVolume(config) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const aspect = size.width / size.height;

  const live = useRef(config);
  live.current = config;

  const count = Math.min(config.particleCount, MAX_BODIES);
  const swarm = useMemo(
    () =>
      createSwarm({
        aspect,
        count,
        depth: config.volumeDepth,
        seed: config.seed,
      }),
    // Not keyed on aspect: a resize remaps through setAspect instead of
    // reseeding, exactly as the flat scene does.
    [count, config.seed, config.volumeDepth]
  );

  const stable = useMemo(() => createStablePipeline(), []);
  useEffect(() => () => stable.dispose(), [stable]);

  const tileSize = tileSizeFor(config.shadowRays);
  const stage = useMemo(
    () => createShadowStage(stable.u, tileSize),
    [stable, tileSize]
  );
  useEffect(() => () => stage.dispose(), [stage]);

  const paletteSignature = paletteKey(config);
  const palette = useMemo(() => buildPalette(config), [paletteSignature]);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  const scratch = useMemo(
    () => ({
      buffer: new THREE.Vector2(),
      field: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      plane: new THREE.Plane(),
    }),
    []
  );

  useFrame((state, delta) => {
    const c = live.current;
    const s = scratch;
    const { u } = stable;

    state.camera.getWorldDirection(s.normal);
    s.plane.set(s.normal, 0);
    state.raycaster.setFromCamera(state.pointer, state.camera);
    if (state.raycaster.ray.intersectPlane(s.plane, s.hit)) {
      worldToField(s.field, s.hit, swarm);
    }

    swarm.setAspect(aspect);
    swarm.step(Math.min(delta, MAX_DELTA), state.clock.elapsedTime, {
      ...c,
      pointerX: s.field.x,
      pointerY: s.field.y,
      pointerZ: s.field.z,
    });

    const lightCount = packBodies(u, swarm, c, paletteRef.current);

    u.ambient.value = c.ambient;
    u.bodyTint.value.set(c.bodyTint);
    u.density.value = c.volumeDensity;
    u.exposure.value = c.exposure;
    u.fieldColor.value.set(c.fieldColor);
    u.glassDepth.value = c.refractDepth;
    u.glassDispersion.value = c.refractDispersion;
    u.glassIor.value = c.refractIor;
    u.glassReflect.value = c.refractReflect;
    u.lightStrength.value = c.lightStrength;
    u.shaftSamples.value = c.shaftSamples;
    u.softness.value = c.shadowSoftness;

    gl.getDrawingBufferSize(s.buffer);
    const width = Math.max(1, Math.round(s.buffer.x * c.renderScale));
    const height = Math.max(1, Math.round(s.buffer.y * c.renderScale));
    if (
      stable.litTarget.width !== width ||
      stable.litTarget.height !== height
    ) {
      stable.litTarget.setSize(width, height);
    }

    state.camera.updateMatrixWorld();
    packCamera(u, state.camera, s.buffer.y);

    if (lightCount > 0) {
      stage.atlas.setLightCount(lightCount);
      gl.compute(stage.atlas.kernel);
    }

    const previousTarget = gl.getRenderTarget();

    stable.passMesh.material = stage.litMaterial;
    gl.setRenderTarget(stable.litTarget);
    gl.render(stable.passScene, stable.passCamera);

    stable.passMesh.material = stable.glassMaterial;
    gl.setRenderTarget(previousTarget);
    gl.render(stable.passScene, stable.passCamera);
  }, 1);
}
