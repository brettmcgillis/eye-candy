import * as THREE from 'three/webgpu';

import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import createImpactFoam from '../utils/impactFoam';
import createLightCone from '../utils/lightCone';
import createRainMaterial from '../utils/rainMaterial';
import createRainSimulation from '../utils/rainSimulation';

export const MAX_DROP_COUNT = 1000000;
export const MAX_FOAM_SPLAT_COUNT = 120000;

function clampCount(value, ceiling) {
  return Math.max(1000, Math.min(ceiling, Math.floor(value || 1000)));
}

function RainSystem({ config, surface }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    if (!gl?.isWebGPURenderer || !surface?.probe) {
      return undefined;
    }

    const simulation = createRainSimulation({
      capacity: MAX_DROP_COUNT,
      probe: surface.probe,
    });
    const lightCone = createLightCone();
    const rain = createRainMaterial({ lightCone, simulation });
    const impactFoam = surface.impactFoamRT
      ? createImpactFoam({ renderTarget: surface.impactFoamRT, simulation })
      : null;

    const drops = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), rain.material);
    drops.frustumCulled = false;
    drops.count = clampCount(config?.rain?.dropCount, MAX_DROP_COUNT);
    scene.add(drops);

    impactFoam?.clear(gl);
    gl.compute(simulation.init);

    runtimeRef.current = {
      drops,
      impactFoam,
      lightCone,
      rain,
      simulation,
    };

    return () => {
      runtimeRef.current = null;
      scene.remove(drops);
      drops.geometry.dispose();
      rain.material.dispose();
      impactFoam?.dispose();
    };
  }, [gl, scene, surface]);

  useFrame((state, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

    const { light, ocean, rain } = config;
    const enabled = rain.enabled !== false;

    phaseRef.current += delta * light.driftSpeed;

    runtime.lightCone.applyConfig(light, phaseRef.current);
    runtime.rain.applyConfig(rain);

    const { uniforms } = runtime.simulation;
    Object.keys(uniforms).forEach((key) => {
      if (rain[key] !== undefined) {
        uniforms[key].value = rain[key];
      }
    });

    const count = clampCount(rain.dropCount, MAX_DROP_COUNT);

    runtime.drops.count = count;
    runtime.drops.visible = enabled;
    runtime.simulation.update.count = count;

    if (enabled) {
      gl.compute(runtime.simulation.update);
    }

    if (!runtime.impactFoam || !ocean.visible) {
      return;
    }

    runtime.impactFoam.applyConfig(
      ocean,
      Math.min(count, MAX_FOAM_SPLAT_COUNT)
    );
    runtime.impactFoam.render(gl);
  });

  return null;
}

export default memo(RainSystem);
