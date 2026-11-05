import React, { useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { flameParams, maxBodyRadius, mirrorEnd } from '@modules/candle';
import { createFireSim } from '@modules/fireSim';

import createWaxOccluder from './waxOccluder';

// The sim's box round a wick, in units of the flame's size.
const BOX = [0.6, 2.2, 0.6];
// The height the solver's forces were tuned at (the first 1.6-tall box).
const FORCE_HEIGHT = 1.6;
const BELOW = 0.1;

export function simBox(placement) {
  const { size, top } = placement;
  const box = BOX.map((v) => v * size);
  const centre = [
    top.base[0],
    top.base[1] - BELOW * size + box[1] / 2,
    top.base[2],
  ];
  return { box, centre };
}

// One fluid sim burning at the top wick, drawn twice: upright over the top
// wick and turned half a turn about z under the bottom one.
export default function SimFlames({
  config,
  drive,
  effectsRef,
  form,
  placement,
}) {
  const gl = useThree((state) => state.gl);
  const { box, centre } = useMemo(() => simBox(placement), [placement]);
  const wax = useMemo(() => createWaxOccluder(), []);
  const sim = useMemo(
    () =>
      createFireSim({
        forceHeight: FORCE_HEIGHT * placement.size,
        occluder: wax.occluder,
        resolution: config.simResolution,
        size: box,
      }),
    [box, config.simResolution, placement.size, wax]
  );
  const widest = useMemo(() => maxBodyRadius(form) * 1.01, [form]);
  const material = useMemo(() => sim.material(config.look), [config.look, sim]);
  const geometry = useMemo(() => new THREE.BoxGeometry(...box), [box]);

  useEffect(
    () => () => {
      sim.dispose();
      material.dispose();
      geometry.dispose();
    },
    [geometry, material, sim]
  );

  const u = sim.uniforms;
  const p = flameParams(config);
  const { size } = placement;
  Object.assign(u.blue, { value: config.flameBlue * 1.5 });
  u.blueColor.value.set(config.flameBlueColor);
  u.startColor.value.set(config.flameStartColor);
  u.midColor.value.set(config.flameMidColor);
  u.endColor.value.set(config.flameEndColor);
  u.hue.value = ((config.flameHue ?? 0) * Math.PI) / 180;
  u.intensity.value = config.flameIntensity;
  u.steps.value = Math.round(config.simSteps);
  u.buoyancy.value = p.buoyancy;
  u.turbulence.value =
    p.turbulence * 1.2 * (config.look === 'realistic' ? 1 : 0.55);
  u.bands.value = config.toonBands;
  u.ink.value.set(config.toonInk);
  u.prints.value = config.clayPrints;
  const styled = config.look !== 'realistic';
  u.cooling.value = (styled ? 3.6 : 1.3) / p.life;
  u.dissipation.value = 1 / p.sootLife;
  u.emitSoot.value = p.soot;
  const sourceRadius = 0.05 * size * (styled ? 1.8 : 1);
  const w = wax.uniforms;
  w.candleMatrix.value
    .makeRotationZ((-(config.tilt ?? 0) * Math.PI) / 180)
    .multiply(new THREE.Matrix4().makeTranslation(...centre));
  w.rimY.value = (form.rimAt(0) + form.rimAt(2) + form.rimAt(4)) / 3;
  w.poolY.value = form.pool;
  w.outerR.value = widest;
  w.innerR.value = form.radius - form.wall;

  const anchors = useMemo(() => {
    const local = (q) => q.map((v, k) => v - centre[k]);
    const { mid, tip } = placement.top;
    return {
      a: local(mid),
      b: local([tip[0], tip[1] + 0.03 * size, tip[2]]),
    };
  }, [centre, placement, size]);

  useFrame(() => {
    if (!(drive.delta > 0)) return;
    sim.advance(gl, drive.delta, () => {
      const { signal } = drive;
      const { lit } = drive;
      u.emit.value = signal.emit * lit;
      u.emitTemperature.value =
        (config.look === 'realistic' ? 20 : 15) * (p.temperature / 5.5);
      u.emitFuel.value = lit;
      u.wind.value.set(signal.wind[0], 0, signal.wind[1]);
      sim.setEmitter(0, {
        a: [
          anchors.a[0] + signal.sway[0],
          anchors.a[1],
          anchors.a[2] + signal.sway[1],
        ],
        b: [
          anchors.b[0] + signal.sway[0] * 2,
          anchors.b[1],
          anchors.b[2] + signal.sway[1] * 2,
        ],
        radius: sourceRadius,
      });
    });
  }, -1);

  if (effectsRef) {
    // eslint-disable-next-line no-param-reassign
    effectsRef.current = {
      ...effectsRef.current,
      sim: {
        boxes: [
          { centre, mirrored: false },
          { centre: mirrorEnd(centre), mirrored: true },
        ],
        read: () => sim.read(gl),
      },
    };
  }

  return (
    <>
      <mesh
        frustumCulled={false}
        geometry={geometry}
        material={material}
        position={centre}
        renderOrder={2}
        userData={{ effect: 'flame', plot: false }}
      />
      <mesh
        frustumCulled={false}
        geometry={geometry}
        material={material}
        position={mirrorEnd(centre)}
        renderOrder={2}
        rotation={[0, 0, Math.PI]}
        userData={{ effect: 'flame', plot: false }}
      />
    </>
  );
}
