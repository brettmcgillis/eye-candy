import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import {
  RIBBON_LENGTH,
  RIBBON_WIDTH,
  RIBBON_WRAP_RADIUS,
} from '@modules/rabbit';

import { createRibbonMaterial } from './materials';
import createRibbonSim from './ribbonSim';

const ROWS = 28;
const COLUMNS = 3;
const NOTCH = 0.75;
const TWIST = 0.6;
const MAX_STEP = 1 / 30;
const WIND_HEADING = new THREE.Vector3(-1, 0, 0.35).normalize();
const KNOT_SCALE = [1.6, 1, 1.1];
const SHEET = { doubleSided: true };

const wind = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

function stripGeometry() {
  const geometry = new THREE.BufferGeometry();
  const uvs = [];
  const index = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLUMNS; c += 1) {
      uvs.push(r / (ROWS - 1), c / (COLUMNS - 1));
      if (r + 1 < ROWS && c + 1 < COLUMNS) {
        const a = r * COLUMNS + c;
        index.push(a, a + COLUMNS, a + 1, a + 1, a + COLUMNS, a + COLUMNS + 1);
      }
    }
  }
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(ROWS * COLUMNS * 3), 3)
  );
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array(ROWS * COLUMNS * 3), 3)
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  return geometry;
}

// Gusts that build and fade over seconds, with a ripple travelling down the
// ribbon so it flutters rather than swinging as one piece.
function gust(speed, time, row) {
  const swell =
    0.65 +
    0.2 * Math.sin(time * 0.53) +
    0.1 * Math.sin(time * 1.37 + 1.1) +
    0.05 * Math.sin(time * 3.1 + 2.3);
  const yaw = 0.35 * Math.sin(time * 0.29 + 0.7);
  const ripple = 0.12 * Math.sin(time * 6.5 - row * 0.45);
  return wind
    .copy(WIND_HEADING)
    .applyAxisAngle(up, yaw)
    .multiplyScalar(speed * (swell + ripple));
}

function midpoint(position, row, axis) {
  return (
    (position[row * 2].getComponent(axis) +
      position[row * 2 + 1].getComponent(axis)) /
    2
  );
}

// The hanging tail of the hunter's marker: the scene's own ribbon solver,
// drawn as a three-column strip whose last row is cut into a swallowtail.
export default function Ribbon({
  bend,
  drag,
  floorY,
  handles = null,
  tie,
  windSpeed,
}) {
  const sim = useMemo(
    () =>
      createRibbonSim({
        length: RIBBON_LENGTH,
        rows: ROWS,
        width: RIBBON_WIDTH,
      }),
    []
  );
  const geometry = useMemo(stripGeometry, []);
  const material = useMemo(createRibbonMaterial, []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );
  const knotRef = useRef();
  const stripRef = useRef();
  useEffect(() => {
    if (!handles) return undefined;
    // eslint-disable-next-line no-param-reassign
    handles.ribbon = [stripRef.current, knotRef.current];
    return () => {
      // eslint-disable-next-line no-param-reassign
      handles.ribbon = [];
    };
  }, [handles]);
  const started = useRef(false);

  useFrame(({ clock }, delta) => {
    if (!started.current) {
      sim.reset(tie, RIBBON_WRAP_RADIUS);
      started.current = true;
    }
    const time = clock.elapsedTime;
    sim.step(Math.min(delta, MAX_STEP), {
      bendCompliance: 10 ** (1 - 3 * bend),
      capsules: tie.capsules,
      damping: 0.4 * drag,
      drag,
      floorY,
      knot: tie,
      twist: TWIST,
      windAt: (row) => gust(windSpeed, time, row),
      wrapRadius: RIBBON_WRAP_RADIUS,
    });

    const { position } = sim;
    const out = geometry.attributes.position;
    for (let r = 0; r < ROWS; r += 1) {
      const left = position[r * 2];
      const right = position[r * 2 + 1];
      const notch = r === ROWS - 1 ? NOTCH : 0;
      const above = Math.max(0, r - 1);
      out.setXYZ(r * COLUMNS, left.x, left.y, left.z);
      out.setXYZ(r * COLUMNS + 2, right.x, right.y, right.z);
      out.setXYZ(
        r * COLUMNS + 1,
        ...[0, 1, 2].map((axis) =>
          THREE.MathUtils.lerp(
            midpoint(position, r, axis),
            midpoint(position, above, axis),
            notch
          )
        )
      );
    }
    out.needsUpdate = true;
    geometry.computeVertexNormals();

    const knot = knotRef.current;
    knot.position
      .copy(tie.center)
      .addScaledVector(sim.down, RIBBON_WRAP_RADIUS * 0.85);
    knot.quaternion.setFromUnitVectors(up, sim.down);
  });

  return (
    <>
      <mesh
        castShadow
        frustumCulled={false}
        geometry={geometry}
        material={material}
        ref={stripRef}
        userData={SHEET}
      />
      <mesh castShadow material={material} ref={knotRef} scale={KNOT_SCALE}>
        <sphereGeometry args={[0.0028, 12, 8]} />
      </mesh>
    </>
  );
}
