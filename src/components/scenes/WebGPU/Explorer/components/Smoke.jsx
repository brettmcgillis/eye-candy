import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  float,
  instanceIndex,
  positionView,
  smoothstep,
  texture as tslTexture,
  uniform,
  uv,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import lantern from '../utils/lantern';
import createPuffTexture from '../utils/puffTexture';
import { createDistanceField, createUniforms } from '../utils/sceneTSL';
import createSmokeSimulation, { createSmokeUniforms } from '../utils/smokeSim';

function Smoke({ config, worldRef }) {
  const configRef = useRef(config);
  configRef.current = config;

  const renderer = useThree((state) => state.gl);
  const { smokeCount } = config;

  const puff = useMemo(() => createPuffTexture(), []);

  // The smoke marches the same distance field the caverns do, so the plume
  // goes dark on the far side of a branch instead of glowing through it.
  const fieldUniforms = useMemo(createUniforms, []);
  const u = useMemo(createSmokeUniforms, []);

  const sim = useMemo(
    () =>
      createSmokeSimulation({
        count: smokeCount,
        df: createDistanceField(fieldUniforms),
        u,
      }),
    [fieldUniforms, smokeCount, u]
  );

  const look = useMemo(
    () => ({
      emissive: uniform(0.12),
      emissiveColor: uniform(new THREE.Color(1, 0.5, 0.2)),
      fadeExp: uniform(1.6),
      growth: uniform(2.2),
      lightColor: uniform(new THREE.Color(1, 0.72, 0.36)),
      lightFalloff: uniform(0.05),
      lightIntensity: uniform(6),
      maxPixels: uniform(96),
      opacity: uniform(0.07),
      rise: uniform(0.12),
      scatter: uniform(1),
      size: uniform(140),
    }),
    []
  );

  const material = useMemo(() => {
    const { order, posAge, shade, velLife } = sim.buffers;

    // Instances are drawn in buffer order, so reading each particle through
    // the sorted index list *is* the back-to-front draw order.
    const sorted = order.element(instanceIndex).y.toUint();
    const particle = posAge.element(sorted);
    const life = velLife.element(sorted).w;
    const lit = shade.element(sorted).y;

    const t = particle.w.div(life.max(1e-4)).clamp(0, 1);

    const toLight = u.emitterPos.sub(particle.xyz);
    const distance = toLight.length();
    const falloff = look.lightIntensity.div(
      float(1).add(distance.mul(distance).mul(look.lightFalloff))
    );

    const rgb = look.lightColor
      .mul(falloff)
      .mul(lit)
      .mul(look.scatter)
      .add(look.emissiveColor.mul(look.emissive));

    const alpha = tslTexture(puff, uv())
      .a.mul(look.opacity)
      .mul(smoothstep(0, look.rise, t))
      .mul(t.oneMinus().pow(look.fadeExp));

    const nodeMaterial = new THREE.PointsNodeMaterial({
      blending: THREE.NormalBlending,
      depthTest: true,
      depthWrite: false,
      sizeAttenuation: false,
      toneMapped: false,
      transparent: true,
    });

    nodeMaterial.positionNode = particle.xyz;
    // The camera chases the emitter, so particles stream straight past it and
    // viewZ goes to zero — without this clamp a single one of them covers the
    // screen, and there are thousands. Overdraw is what costs here, not count.
    nodeMaterial.sizeNode = look.size
      .mul(float(1).add(t.mul(look.growth)))
      .div(positionView.z.negate().max(0.05))
      .clamp(0, look.maxPixels);
    nodeMaterial.colorNode = vec4(rgb, alpha);

    return nodeMaterial;
  }, [look, puff, sim, u]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
      puff?.dispose();
    },
    [geometry, material, puff]
  );

  const cursorRef = useRef(0);
  const seededRef = useRef(false);
  const frameRef = useRef(0);
  const previousEmitter = useMemo(() => new THREE.Vector3(), []);

  // Changing the particle count rebuilds the buffers and the sort schedule,
  // so the walk through that schedule has to start over with them.
  useEffect(() => {
    cursorRef.current = 0;
    seededRef.current = false;
  }, [sim]);

  useFrame((state, delta) => {
    const c = configRef.current;
    if (!c.smokeEnabled) return;

    const world = worldRef.current;
    const scale = c.worldScale;
    const dt = Math.min(delta, 1 / 30) * c.timeScale;

    frameRef.current += 1;
    u.dt.value = dt;
    u.time.value = state.clock.elapsedTime;
    u.shadowFrame.value = frameRef.current;
    u.cameraPos.value.copy(state.camera.position);

    u.emitterVelocity.value
      .copy(world.position)
      .sub(previousEmitter)
      .divideScalar(Math.max(dt, 1e-4));
    previousEmitter.copy(world.position);
    u.emitterPos.value.copy(world.position);
    u.emitterRadius.value = c.sphereRadius * scale;

    u.buoyancy.value = c.smokeBuoyancy * scale;
    u.curlDrift.value = c.curlDrift;
    u.curlFrequency.value = c.curlFrequency / scale;
    u.curlStrength.value = c.curlStrength * scale;
    u.drag.value = c.smokeDrag;
    u.ejectSpeed.value = c.ejectSpeed * scale;
    u.inherit.value = c.inheritVelocity;
    u.lifespan.value = c.smokeLifespan;
    u.shadowBias.value = c.shadowBias * scale;
    u.shadowHardness.value = c.smokeShadowHardness;
    u.shadowSteps.value = c.smokeShadowSteps;
    u.shadowStride.value = c.smokeShadowStride;
    u.stepSafety.value = c.stepSafety;

    // The smoke marches its own copy of the field, so its fractal uniforms
    // have to track the Caverns folder too.
    const f = fieldUniforms;
    f.folds.value = c.folds;
    f.scaleBase.value = c.scaleBase;
    f.scaleGain.value = c.scaleGain;
    f.twist.value = c.twist;
    f.periodY.value = c.periodY;
    f.periodXZ.value = c.periodXZ;
    f.confine.value = c.confine ? 1 : 0;
    f.worldScale.value = scale;
    f.pivot.value.set(c.pivotX, c.pivotY, c.pivotZ);

    look.lightColor.value.setStyle(c.lightColor, THREE.LinearSRGBColorSpace);
    look.lightIntensity.value = c.lightIntensity;
    look.lightFalloff.value = lantern(c).falloff;
    look.emissiveColor.value.setStyle(
      c.smokeEmissiveColor,
      THREE.LinearSRGBColorSpace
    );
    look.emissive.value = c.smokeEmissive;
    look.scatter.value = c.smokeScatter;
    look.opacity.value = c.smokeOpacity;
    look.rise.value = c.smokeRise;
    look.fadeExp.value = c.smokeFade;
    look.growth.value = c.smokeGrowth;
    look.size.value = c.smokeSize * scale;
    look.maxPixels.value = c.smokeMaxPixels;

    if (!seededRef.current) {
      renderer.compute(sim.kernels.seed);
      renderer.compute(sim.kernels.key);
      seededRef.current = true;
    }

    renderer.compute(sim.kernels.simulate);

    // Re-key only at the top of the network: rewriting the keys mid-sort
    // would break the bitonic ordering the remaining passes assume.
    if (cursorRef.current === 0) renderer.compute(sim.kernels.key);

    for (let n = 0; n < c.sortPasses; n += 1) {
      const [k, j] = sim.schedule[cursorRef.current];
      u.sortK.value = k;
      u.sortJ.value = j;
      renderer.compute(sim.kernels.sort);

      cursorRef.current = (cursorRef.current + 1) % sim.schedule.length;
      if (cursorRef.current === 0) break;
    }
  });

  // Unmount rather than just skipping the update: the sim never seeds while
  // disabled, so leaving the mesh in the tree draws thousands of transparent
  // sprites off an all-zero buffer — every one of them stacked at the origin,
  // which is the worst possible case for overdraw.
  if (!config.smokeEnabled) return null;

  return (
    <instancedMesh
      args={[geometry, material, smokeCount]}
      frustumCulled={false}
    />
  );
}

export default memo(Smoke);
