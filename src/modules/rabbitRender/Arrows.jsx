import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  POSE_TIME,
  RIBBON_TIE_INSET,
  SHAFT_RADIUS,
  arrowDirection,
} from '@modules/rabbit';

import Arrow from './Arrow';
import { createArrowBody, resetArrowBody, stepArrows } from './arrowDynamics';
import { distanceToSegment } from './bodyCapsules';
import { createOutlineMaterial, createRibbonMaterial } from './materials';
import { pinToSkin, readSkinPin, restPosition } from './skinPin';

const WOUND_RADIUS = 0.028;
const DYNAMICS = {
  colliderLever: 0.12,
  floorClearance: 0.008,
  floorFriction: 0.6,
  gravity: 9.8,
  maxDeflection: THREE.MathUtils.degToRad(30),
  shaftGap: SHAFT_RADIUS * 2.6,
  shaftRadius: SHAFT_RADIUS,
};
const WOUND_CLEARANCE = 0.01;

const up = new THREE.Vector3(0, 1, 0);

// The capsules a wound sits inside are the flesh holding that arrow, not
// obstacles to it.
function capsulesHolding(probe, capsules, point) {
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  return new Set(
    capsules.flatMap(({ bone, radius, tip }, i) => {
      probe.bone(bone).getWorldPosition(start);
      probe.bone(bone).localToWorld(end.copy(tip));
      return distanceToSegment(point, start, end) < radius + WOUND_CLEARANCE
        ? [i]
        : [];
    })
  );
}

function woundArrows(probe, wounds, capsules, volley) {
  probe.pose(POSE_TIME);
  const raycaster = new THREE.Raycaster();
  const meshScale = probe.mesh.matrixWorld.getMaxScaleOnAxis();
  const rest = new THREE.Vector3();
  wounds.points.forEach((point) => point.value.set(0, -1e4, 0, 1));

  const struck = volley.flatMap((def) => {
    const direction = arrowDirection(def, new THREE.Vector3());
    const aim = new THREE.Vector3(...def.aim);
    raycaster.set(
      aim.clone().addScaledVector(direction, 1),
      direction.clone().negate()
    );
    const hits = raycaster.intersectObject(probe.mesh, false);
    const hit = hits.findLast((h) => h.distance < 1) ?? hits[0];
    return hit ? [{ def, direction, hit }] : [];
  });

  return struck.map(({ def, direction, hit }, i) => {
    const pin = pinToSkin(probe.mesh, hit, direction);
    restPosition(probe.mesh, pin, rest);
    wounds.points[i].value.set(
      rest.x,
      rest.y,
      rest.z,
      WOUND_RADIUS / meshScale
    );
    return {
      ...def,
      body: createArrowBody(
        hit.point,
        direction,
        def.length,
        capsulesHolding(probe, capsules, hit.point)
      ),
      pin,
      seed: 17 + i * 5,
    };
  });
}

export default function Arrows({
  capsules,
  damping,
  floorY,
  handles,
  model,
  onTieReady,
  outlineColor,
  outlineWidth,
  probe,
  stiffness,
  tie,
  volley,
  wounds,
}) {
  const arrows = useMemo(
    () => woundArrows(probe, wounds, capsules, volley),
    [capsules, probe, volley, wounds]
  );
  const groupRefs = useRef([]);
  const settled = useRef(false);

  const colliders = useMemo(
    () =>
      capsules.map(({ bone, radius, tip }) => ({
        bone: model.scene.getObjectByName(bone),
        end: new THREE.Vector3(),
        radius,
        start: new THREE.Vector3(),
        tip,
      })),
    [capsules, model]
  );

  const materials = useMemo(
    () => ({
      fletching: new THREE.MeshStandardNodeMaterial({
        color: '#3e3a37',
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
      nock: new THREE.MeshStandardNodeMaterial({
        color: '#2b2826',
        roughness: 0.7,
      }),
      shaft: new THREE.MeshStandardNodeMaterial({
        color: '#ddd6cb',
        roughness: 0.85,
      }),
      tie: createRibbonMaterial(),
    }),
    []
  );
  const ink = useMemo(() => uniform(new THREE.Color()), []);
  const inkWidth = useMemo(() => uniform(0), []);
  const outlineMaterial = useMemo(
    () => createOutlineMaterial({ color: ink, width: inkWidth }),
    [ink, inkWidth]
  );
  useEffect(
    () => () =>
      [...Object.values(materials), outlineMaterial].forEach((m) =>
        m.dispose()
      ),
    [materials, outlineMaterial]
  );
  useEffect(() => {
    ink.value.set(outlineColor);
    inkWidth.value = outlineWidth;
  }, [ink, inkWidth, outlineColor, outlineWidth]);

  const tied = arrows.find((arrow) => arrow.ribbon);

  const shafts = useMemo(
    () =>
      arrows.map(() => ({
        end: new THREE.Vector3(),
        radius: SHAFT_RADIUS,
        start: new THREE.Vector3(),
      })),
    [arrows]
  );

  const placeTie = () => {
    const { body } = tied;
    tie.axis.copy(body.direction);
    tie.center
      .copy(body.entry)
      .addScaledVector(body.direction, body.length - RIBBON_TIE_INSET);
  };

  useLayoutEffect(() => {
    settled.current = false;
    // eslint-disable-next-line no-param-reassign
    handles.arrows = groupRefs.current.slice(0, arrows.length);
    // eslint-disable-next-line no-param-reassign
    tie.capsules = [...colliders, ...shafts];
  }, [arrows, colliders, handles, shafts, tie]);

  useFrame((_, delta) => {
    model.scene.updateMatrixWorld(true);
    arrows.forEach(({ body, pin }) => {
      readSkinPin(probe.liveMesh, pin, body.entry, body.target);
    });
    colliders.forEach((collider) => {
      collider.bone.getWorldPosition(collider.start);
      collider.bone.localToWorld(collider.end.copy(collider.tip));
    });

    if (!settled.current) {
      arrows.forEach(({ body }) => resetArrowBody(body));
    }
    stepArrows(
      arrows.map(({ body }) => body),
      colliders,
      settled.current ? delta : 1 / 60,
      { ...DYNAMICS, damping, floorY, stiffness }
    );

    arrows.forEach(({ body }, i) => {
      const group = groupRefs.current[i];
      group.position.copy(body.entry);
      group.quaternion.setFromUnitVectors(up, body.direction);
      shafts[i].start.copy(body.entry);
      shafts[i].end.copy(body.tail);
    });

    if (tied) placeTie();
    if (!settled.current) {
      settled.current = true;
      if (tied) onTieReady();
    }
  });

  return arrows.map((arrow, i) => (
    <Arrow
      key={arrow.key}
      length={arrow.length}
      materials={materials}
      outlineMaterial={outlineMaterial}
      ref={(group) => {
        groupRefs.current[i] = group;
      }}
      ribbon={arrow.ribbon}
      seed={arrow.seed}
    />
  ));
}

// What the ribbon reads from the arrows each frame: the knot on its shaft
// and everything it can drape against.
export function createTie() {
  return {
    axis: new THREE.Vector3(1, 0, 0),
    capsules: [],
    center: new THREE.Vector3(),
  };
}
