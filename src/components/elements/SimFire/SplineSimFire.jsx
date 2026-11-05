import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { createFireSim } from '@modules/fireSim';

import { fireLayout } from './simFireLayout';

// Coarser than the candle's 1/120: at metre scale a frame-rate step is
// stable, and at most two per frame keeps a slow frame from snowballing.
const STEP = 1 / 60;
const MAX_STEPS = 2;

// Uneven flicker per emitter, about 1 on average.
const flicker = (t, i, amount) =>
  1 +
  amount *
    (Math.sin(t * 4.1 + i * 1.7) * 0.5 +
      Math.sin(t * 7.7 + i * 2.9) * 0.3 +
      Math.sin(t * 13.3 + i * 0.6) * 0.2);

// The Burning At Both Ends fluid fire over authored Fire splines: one sim
// box round all of them, each spline an emitter along its start and a guide
// the gas is pulled along, with buoyancy and turbulence on top. Hidden
// behind the opaque scene by its depth. WebGPU only. A flickering point
// light sits over the emitters.
function SplineSimFire({ fire, splines }) {
  const gl = useThree((state) => state.gl);
  const layout = useMemo(
    () => fireLayout(splines, fire),
    [
      splines,
      fire.emitLength,
      fire.emitRadius,
      fire.guideRadius,
      fire.guideSpeed,
      fire.guideTaper,
      fire.headroom,
      fire.padding,
    ]
  );
  const sizeKey = layout?.size.map((v) => v.toFixed(3)).join(',');
  const sim = useMemo(
    () =>
      layout
        ? createFireSim({
            forceHeight: fire.forceHeight,
            occluder: 'depth',
            resolution: fire.resolution,
            size: layout.size,
            step: STEP,
          })
        : null,
    [sizeKey, fire.forceHeight, fire.resolution]
  );
  const material = useMemo(() => sim?.material(fire.look), [fire.look, sim]);
  const geometry = useMemo(
    () => (layout ? new THREE.BoxGeometry(...layout.size) : null),
    [sizeKey]
  );
  const light = useRef();

  useEffect(
    () => () => {
      sim?.dispose();
      material?.dispose();
      geometry?.dispose();
    },
    [geometry, material, sim]
  );

  useEffect(() => {
    if (sim && layout) sim.setGuides(layout.guides);
  }, [layout, sim]);

  const glowAt = useMemo(() => {
    if (!layout) return [0, 0, 0];
    const mid = [0, 1, 2].map(
      (k) =>
        layout.emitters.reduce((sum, e) => sum + e.b[k], 0) /
        layout.emitters.length
    );
    return mid.map((v, k) => v + layout.centre[k] + (k === 1 ? 0.4 : 0));
  }, [layout]);

  if (sim) {
    const u = sim.uniforms;
    u.startColor.value.set(fire.startColor);
    u.midColor.value.set(fire.midColor);
    u.endColor.value.set(fire.endColor);
    u.blue.value = fire.blue;
    u.intensity.value = fire.intensity;
    u.glow.value = fire.glow;
    u.steps.value = Math.round(fire.steps);
    u.buoyancy.value = fire.buoyancy;
    u.weight.value = fire.weight;
    u.turbulence.value = fire.turbulence;
    u.turbFrequency.value = fire.turbFrequency;
    u.cooling.value = fire.cooling;
    u.dissipation.value = fire.dissipation;
    u.emitSoot.value = fire.soot;
    u.sootDensity.value = fire.sootDensity;
    u.emitTemperature.value = fire.temperature;
    u.guidePull.value = fire.guidePull;
    u.velDamping.value = fire.damping;
    u.wind.value.set(...fire.wind);
    u.flameOpacity.value = fire.flameOpacity ?? 0;
    u.sootColor.value.set(fire.sootColor ?? '#000000');
    u.cutoff.value = fire.cutoff ?? 0;
    u.skipBelow.value = fire.skipBelow ?? -1;
    u.stepLength.value = fire.stepLength ?? 0;
  }

  useFrame((state, delta) => {
    if (!sim || !layout) return;
    sim.advance(
      gl,
      delta,
      (t) => {
        layout.emitters.forEach((emitter, i) => {
          sim.setEmitter(i, {
            ...emitter,
            strength: emitter.strength * flicker(t, i, fire.flicker),
          });
        });
        sim.setEmitterCount(layout.emitters.length);
      },
      MAX_STEPS
    );
    if (light.current) {
      light.current.intensity =
        fire.lightIntensity * flicker(state.clock.elapsedTime * 1.3, 0, 0.35);
    }
  }, -1);

  if (!sim || !layout) return null;

  return (
    <>
      <mesh
        frustumCulled={false}
        geometry={geometry}
        material={material}
        position={layout.centre}
        renderOrder={2}
      />
      {fire.lightIntensity > 0 ? (
        <pointLight
          ref={light}
          color={fire.lightColor}
          decay={2}
          distance={fire.lightDistance}
          intensity={fire.lightIntensity}
          position={glowAt}
        />
      ) : null}
    </>
  );
}

export default memo(SplineSimFire);
