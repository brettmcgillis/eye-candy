import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { MAX_EMITTERS, createFireSim } from '@modules/fireSim';

const STEP = 1 / 60;
const MAX_STEPS = 1;

// The flame box in unscaled horse units (the rig is ~2.5 long, ~1.7 tall,
// facing -Z). It wraps the neck and tail with room behind for the run wind
// to stream the flames back; `fireTrail` adds to the far end.
const BOX_MIN = [-0.7, 0.3, -1.6];
const BOX_MAX = [0.7, 2.7, 1.4];

const flicker = (t, i, amount) =>
  1 +
  amount *
    (Math.sin(t * 4.1 + i * 1.7) * 0.5 +
      Math.sin(t * 7.7 + i * 2.9) * 0.3 +
      Math.sin(t * 13.3 + i * 0.6) * 0.2);

const point = new THREE.Vector3();

function chainPoints(bones, centre, lift) {
  return bones.map((bone) => {
    bone.getWorldPosition(point);
    return [
      point.x - centre[0],
      point.y - centre[1] + lift,
      point.z - centre[2],
    ];
  });
}

function segments(points, strength, radius) {
  return points.slice(1).map((b, i) => ({ a: points[i], b, radius, strength }));
}

// The webgpu_volume_fire fluid on a box that travels with one horse. The
// horse never translates, so the box is fixed in its frame; the emitters are
// capsules between consecutive mane and tail bones, re-read every step so the
// flames ride the gallop, and the field's travel is a +Z wind through the box.
function HorseFire({ bonesRef, fire, index, position, scale, windSpeed }) {
  const gl = useThree((state) => state.gl);
  const light = useRef();

  const size = useMemo(
    () => [
      (BOX_MAX[0] - BOX_MIN[0]) * scale,
      (BOX_MAX[1] - BOX_MIN[1]) * scale,
      (BOX_MAX[2] + fire.trail - BOX_MIN[2]) * scale,
    ],
    [fire.trail, scale]
  );
  const centre = useMemo(
    () => [
      position[0] + ((BOX_MIN[0] + BOX_MAX[0]) / 2) * scale,
      position[1] + ((BOX_MIN[1] + BOX_MAX[1]) / 2) * scale,
      position[2] + ((BOX_MIN[2] + BOX_MAX[2] + fire.trail) / 2) * scale,
    ],
    [fire.trail, position, scale]
  );
  const sizeKey = size.map((v) => v.toFixed(3)).join(',');

  const sim = useMemo(
    () =>
      createFireSim({
        forceHeight: fire.forceHeight,
        occluder: 'depth',
        resolution: fire.resolution,
        size,
        step: STEP,
      }),
    [sizeKey, fire.forceHeight, fire.resolution]
  );
  const material = useMemo(() => sim.material('realistic'), [sim]);
  const geometry = useMemo(() => new THREE.BoxGeometry(...size), [sizeKey]);

  useEffect(
    () => () => {
      sim.dispose();
      material.dispose();
      geometry.dispose();
    },
    [geometry, material, sim]
  );

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
  u.velDamping.value = fire.damping;
  u.wind.value.set(0, 0, windSpeed);
  u.cutoff.value = 0.02;
  u.skipBelow.value = 0.003;

  useFrame((state, delta) => {
    const bones = bonesRef.current[index];
    if (!bones) return;

    const radius = fire.emitRadius * scale;
    const emitters = [
      ...segments(
        chainPoints(bones.mane, centre, fire.maneLift * scale),
        fire.mane,
        radius
      ),
      ...segments(chainPoints(bones.tail, centre, 0), fire.tail, radius),
    ].slice(0, MAX_EMITTERS);

    sim.advance(
      gl,
      delta,
      (t) => {
        emitters.forEach((emitter, i) => {
          sim.setEmitter(i, {
            ...emitter,
            strength:
              emitter.strength * flicker(t, i + index * 3, fire.flicker),
          });
        });
        sim.setEmitterCount(emitters.length);
      },
      MAX_STEPS
    );

    if (light.current) {
      const neck = bones.mane[Math.floor(bones.mane.length / 2)];
      neck?.getWorldPosition(light.current.position);
      light.current.intensity =
        fire.lightIntensity *
        flicker(state.clock.elapsedTime * 1.3, index, 0.35);
    }
  });

  return (
    <>
      <mesh
        frustumCulled={false}
        geometry={geometry}
        material={material}
        position={centre}
        renderOrder={2}
      />
      {fire.lightIntensity > 0 ? (
        <pointLight
          ref={light}
          color={fire.lightColor}
          decay={2}
          distance={fire.lightDistance}
          intensity={fire.lightIntensity}
        />
      ) : null}
    </>
  );
}

export default memo(HorseFire);
