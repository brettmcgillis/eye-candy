import * as THREE from 'three/webgpu';

import React, { useMemo } from 'react';

import Ribbon from './Ribbon';

// ── Arrow dimensions ──
const SHAFT_RADIUS = 0.008;
const SHAFT_LENGTH = 2.0;
const HEAD_LENGTH = 0.06;
const HEAD_RADIUS = 0.018;
const NOCK_LENGTH = 0.03;
const NOCK_RADIUS = 0.01;

// ── Fletching dimensions ──
const VANE_LENGTH = 0.28;
const VANE_HEIGHT = 0.028;
const VANE_COUNT = 3;
const VANE_OFFSET = 0.08; // distance from nock end

const TIE_BAND_RADIUS = 0.011;
const TIE_BAND_TUBE_RADIUS = 0.0018;
const TIE_KNOT_LENGTH = 0.018;
const TIE_KNOT_RADIUS = 0.0028;

function createArrowGeometries() {
  const shaft = new THREE.CylinderGeometry(
    SHAFT_RADIUS,
    SHAFT_RADIUS,
    SHAFT_LENGTH,
    8
  );
  const head = new THREE.ConeGeometry(HEAD_RADIUS, HEAD_LENGTH, 6);
  const nock = new THREE.CylinderGeometry(
    NOCK_RADIUS,
    SHAFT_RADIUS,
    NOCK_LENGTH,
    6
  );
  const vaneShape = new THREE.Shape();
  vaneShape.moveTo(0, -VANE_LENGTH * 0.5);
  vaneShape.lineTo(0, VANE_LENGTH * 0.5);
  vaneShape.lineTo(VANE_HEIGHT * 0.7, VANE_LENGTH * 0.2);
  vaneShape.lineTo(VANE_HEIGHT, 0);
  vaneShape.lineTo(VANE_HEIGHT * 0.72, -VANE_LENGTH * 0.18);
  vaneShape.closePath();

  const vane = new THREE.ShapeGeometry(vaneShape, 6);
  vane.translate(SHAFT_RADIUS + 0.0015, 0, 0);

  const tieBand = new THREE.TorusGeometry(
    TIE_BAND_RADIUS,
    TIE_BAND_TUBE_RADIUS,
    8,
    24
  );
  const tieKnot = new THREE.CylinderGeometry(
    TIE_KNOT_RADIUS,
    TIE_KNOT_RADIUS,
    TIE_KNOT_LENGTH,
    6
  );

  return { shaft, head, nock, tieBand, tieKnot, vane };
}

function createArrowMaterials() {
  const wood = new THREE.MeshStandardNodeMaterial({
    color: new THREE.Color('#8b7355'),
    roughness: 0.8,
    metalness: 0.0,
  });
  const metal = new THREE.MeshStandardNodeMaterial({
    color: new THREE.Color('#4a4a4a'),
    roughness: 0.3,
    metalness: 0.7,
  });
  const feather = new THREE.MeshStandardNodeMaterial({
    color: new THREE.Color('#d4cbb8'),
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const binding = new THREE.MeshStandardNodeMaterial({
    color: new THREE.Color('#9f3c3c'),
    roughness: 0.55,
    metalness: 0.05,
  });

  return { wood, metal, feather, binding };
}

export default function Arrow({
  hasRibbon = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  ribbonDampening = 0.98,
  ribbonStiffness = 0.25,
  ribbonWind = 1.5,
  scale = 1,
}) {
  const geos = useMemo(createArrowGeometries, []);
  const mats = useMemo(createArrowMaterials, []);

  const halfShaft = SHAFT_LENGTH / 2;
  const headY = halfShaft + HEAD_LENGTH / 2;
  const headTipY = halfShaft + HEAD_LENGTH;
  const nockY = -halfShaft - NOCK_LENGTH / 2;
  const ribbonTieY = -halfShaft + VANE_OFFSET + VANE_LENGTH * 0.35;
  const ribbonTieX = TIE_BAND_RADIUS - TIE_BAND_TUBE_RADIUS * 0.3;

  // Build swept fletching vanes around the shaft, near the nock end.
  const vanes = useMemo(() => {
    const configs = [];
    for (let i = 0; i < VANE_COUNT; i += 1) {
      const angle = (i / VANE_COUNT) * Math.PI * 2;
      configs.push({
        key: `vane-${i}`,
        position: [0, -halfShaft + VANE_OFFSET + VANE_LENGTH * 0.5, 0],
        rotation: [0, angle, 0],
      });
    }
    return configs;
  }, [halfShaft]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, -headTipY, 0]}>
        {/* Shaft */}
        <mesh geometry={geos.shaft} material={mats.wood} />

        {/* Arrowhead */}
        <mesh
          geometry={geos.head}
          material={mats.metal}
          position={[0, headY, 0]}
        />

        {/* Nock */}
        <mesh
          geometry={geos.nock}
          material={mats.wood}
          position={[0, nockY, 0]}
        />

        {/* Fletching vanes */}
        {vanes.map((v) => (
          <mesh
            key={v.key}
            geometry={geos.vane}
            material={mats.feather}
            position={v.position}
            rotation={v.rotation}
          />
        ))}

        {hasRibbon && (
          <>
            <mesh
              geometry={geos.tieBand}
              material={mats.binding}
              position={[0, ribbonTieY, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <mesh
              geometry={geos.tieKnot}
              material={mats.binding}
              position={[ribbonTieX * 0.9, ribbonTieY, 0]}
              rotation={[0, 0, Math.PI / 2]}
            />
            <Ribbon
              position={[ribbonTieX, ribbonTieY, 0]}
              dampening={ribbonDampening}
              stiffness={ribbonStiffness}
              wind={ribbonWind}
            />
          </>
        )}
      </group>
    </group>
  );
}
