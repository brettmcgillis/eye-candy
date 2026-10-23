import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';

import { useFrame } from '@react-three/fiber';

import {
  Fn,
  If,
  Loop,
  float,
  fract,
  instanceIndex,
  instancedArray,
  uint,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import createBurnNodes from './burnNodes';
import createEmberMaterial from './emberMaterial';

const COUNT = 256;
const hash = (value) => fract(value.mul(12.9898).sin().mul(43758.5453));

const BurnEmbers = forwardRef(function BurnEmbers(
  { sim, segmentsX, segmentsY, params, burnUniforms },
  ref
) {
  const resources = useMemo(() => {
    const timeU = uniform(0);
    const rateU = uniform(params.emberRate);
    const driftU = uniform(params.emberDrift);
    const origins = instancedArray(COUNT, 'vec3');
    const velocities = instancedArray(COUNT, 'vec3');
    const births = instancedArray(new Float32Array(COUNT).fill(-1e6), 'float');
    const events = instancedArray(new Float32Array(COUNT).fill(-1), 'float');
    const seeds = instancedArray(
      Float32Array.from({ length: COUNT }, (_, i) => (i * 0.61803398875) % 1),
      'float'
    );
    const uniforms = {
      timeU,
      sizeU: uniform(params.emberSize),
      riseU: uniform(params.emberRise),
      lifeMinU: uniform(0.7),
      lifeMaxU: uniform(1.6),
      colorHotU: uniform(new THREE.Color(params.emberColorHot)),
      colorCoolU: uniform(new THREE.Color(params.emberColorCool)),
      intensityU: uniform(params.emberIntensity),
    };
    const material = createEmberMaterial(uniforms, {
      spawnPosition: origins.element(instanceIndex),
      velocity: velocities.element(instanceIndex),
      spawnTime: births.element(instanceIndex),
      seed: seeds.element(instanceIndex),
    });
    const plane = new THREE.PlaneGeometry(1, 1);
    const geometry = new THREE.InstancedBufferGeometry().copy(plane);
    plane.dispose();
    geometry.instanceCount = COUNT;
    const compute = Fn(() => {
      const event = timeU
        .mul(rateU)
        .div(COUNT)
        .floor()
        .mul(COUNT)
        .add(instanceIndex.toFloat())
        .toVar();
      const born = event.add(1).div(rateU.max(0.001));
      If(
        rateU
          .greaterThan(0)
          .and(born.lessThanEqual(timeU))
          .and(timeU.sub(born).lessThan(1.6))
          .and(event.greaterThan(events.element(instanceIndex))),
        () => {
          events.element(instanceIndex).assign(event);
          const found = float(0).toVar();
          Loop(24, ({ i }) => {
            const key = event
              .mul(37.17)
              .add(i.toFloat().mul(13.31))
              .add(burnUniforms.seed);
            const u = hash(key);
            const v = hash(key.add(7.1));
            const point = vec2(u, v);
            const front = createBurnNodes({ ...burnUniforms, uvNode: point });
            If(
              found
                .equal(0)
                .and(point.sub(0.5).length().lessThan(0.47))
                .and(front.distance.greaterThanEqual(0))
                .and(front.distance.lessThan(burnUniforms.edgeWidth)),
              () => {
                const x = uint(u.mul(segmentsX).round());
                const y = uint(float(1).sub(v).mul(segmentsY).round());
                const vertex = x.mul(segmentsY + 1).add(y);
                origins
                  .element(instanceIndex)
                  .assign(sim.posBuf.element(vertex));
                velocities
                  .element(instanceIndex)
                  .assign(
                    vec3(
                      hash(key.add(1)).sub(0.5).mul(driftU),
                      hash(key.add(2)).sub(0.2).mul(0.15),
                      hash(key.add(3)).sub(0.5).mul(driftU)
                    )
                  );
                births.element(instanceIndex).assign(born);
                found.assign(1);
              }
            );
          });
        }
      );
    })().compute(COUNT);
    return {
      timeU,
      rateU,
      driftU,
      uniforms,
      origins,
      velocities,
      births,
      seeds,
      events,
      material,
      geometry,
      compute,
    };
  }, [sim, segmentsX, segmentsY, burnUniforms]);

  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.material.dispose();
      resources.compute.dispose();
      [
        resources.origins,
        resources.velocities,
        resources.births,
        resources.seeds,
        resources.events,
      ].forEach((buffer) => buffer.value.dispose?.());
    },
    [resources]
  );

  useFrame(({ clock, gl }) => {
    const { uniforms } = resources;
    resources.timeU.value = clock.elapsedTime;
    resources.rateU.value = params.emberRate;
    resources.driftU.value = params.emberDrift;
    uniforms.sizeU.value = params.emberSize;
    uniforms.riseU.value = params.emberRise;
    uniforms.colorHotU.value.set(params.emberColorHot);
    uniforms.colorCoolU.value.set(params.emberColorCool);
    uniforms.intensityU.value = params.emberIntensity;
    gl.compute(resources.compute);
  }, 0.25);

  useImperativeHandle(
    ref,
    () => ({
      async snapshot(renderer) {
        const buffers = await Promise.all(
          [resources.origins, resources.velocities, resources.births].map(
            (buffer) => renderer.getArrayBufferAsync(buffer.value)
          )
        );
        return {
          origins: new Float32Array(buffers[0]),
          velocities: new Float32Array(buffers[1]),
          births: new Float32Array(buffers[2]),
          seeds: resources.seeds.value.array.slice(),
          time: resources.timeU.value,
        };
      },
    }),
    [resources]
  );

  return (
    <mesh
      geometry={resources.geometry}
      material={resources.material}
      frustumCulled={false}
      userData={{ plot: false }}
    />
  );
});
export default BurnEmbers;
