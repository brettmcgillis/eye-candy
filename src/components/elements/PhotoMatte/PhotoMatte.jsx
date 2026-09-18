import React, { memo, useEffect, useMemo } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const DEFAULT_MATERIAL_PROPS = {
  color: '#f4efe5',
  roughness: 0.82,
  metalness: 0,
};

function clampSize(value, fallback) {
  return Math.max(Number.isFinite(value) ? value : fallback, 0.001);
}

function createBoxGeometry(width, height, depth, bevel, bevelSegments) {
  if (bevel > 0) {
    const segments = Math.max(
      1,
      Number.isFinite(bevelSegments) ? Math.floor(bevelSegments) : 1
    );

    return new RoundedBoxGeometry(
      width,
      height,
      depth,
      segments,
      Math.min(bevel, width * 0.49, height * 0.49, depth * 0.49)
    );
  }

  return new THREE.BoxGeometry(width, height, depth);
}

function PhotoMatte({
  width = 4,
  height = 3,
  depth = 0.08,
  apertureWidth = width * 0.68,
  apertureHeight = height * 0.62,
  bevel = 0.02,
  bevelSegments = 3,
  apertureBevel = 0,
  apertureBevelSegments = bevelSegments,
  material = null,
  materials = null,
  materialProps = DEFAULT_MATERIAL_PROPS,
  castShadow = true,
  receiveShadow = true,
  children,
  ...meshProps
}) {
  const safeWidth = clampSize(width, 4);
  const safeHeight = clampSize(height, 3);
  const safeDepth = clampSize(depth, 0.08);
  const safeApertureWidth = Math.min(
    clampSize(apertureWidth, safeWidth * 0.68),
    safeWidth - 0.001
  );
  const safeApertureHeight = Math.min(
    clampSize(apertureHeight, safeHeight * 0.62),
    safeHeight - 0.001
  );
  const safeBevel = Math.max(bevel, 0);
  const safeApertureBevel = Math.max(apertureBevel, 0);
  const meshMaterial =
    material || materials?.frame || materials?.matte || materials?.default;

  const frameGeometry = useMemo(
    () =>
      createBoxGeometry(
        safeWidth,
        safeHeight,
        safeDepth,
        safeBevel,
        bevelSegments
      ),
    [safeWidth, safeHeight, safeDepth, safeBevel, bevelSegments]
  );

  const apertureGeometry = useMemo(
    () =>
      createBoxGeometry(
        safeApertureWidth,
        safeApertureHeight,
        safeDepth * 4,
        safeApertureBevel,
        apertureBevelSegments
      ),
    [
      safeApertureWidth,
      safeApertureHeight,
      safeDepth,
      safeApertureBevel,
      apertureBevelSegments,
    ]
  );

  useEffect(
    () => () => {
      frameGeometry.dispose();
      apertureGeometry.dispose();
    },
    [frameGeometry, apertureGeometry]
  );

  return (
    <mesh
      castShadow={castShadow}
      material={meshMaterial || undefined}
      receiveShadow={receiveShadow}
      {...meshProps}
    >
      <Geometry computeVertexNormals>
        <Base geometry={frameGeometry} />
        <Subtraction geometry={apertureGeometry} />
      </Geometry>
      {!meshMaterial && !children && (
        <meshStandardMaterial {...materialProps} />
      )}
      {children}
    </mesh>
  );
}

export default memo(PhotoMatte);
