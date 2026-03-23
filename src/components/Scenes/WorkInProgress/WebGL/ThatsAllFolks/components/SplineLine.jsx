import * as THREE from 'three';

import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

export default function TafSplineLine({
  points,
  tension = 0.5,
  closed = false,
  color = '#ffffff',
  visible = true,
  arcSegments = 300,
}) {
  const lineRef = useRef();
  const geoRef = useRef(null);

  if (!geoRef.current || geoRef.current.userData.segments !== arcSegments) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(arcSegments * 3), 3)
    );
    geo.userData.segments = arcSegments;
    geoRef.current = geo;
  }

  useFrame(() => {
    if (!visible || !lineRef.current || points.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(
      [...points],
      closed,
      'catmullrom',
      tension
    );
    const pos = lineRef.current.geometry.attributes.position;
    const tmp = new THREE.Vector3();
    for (let i = 0; i < arcSegments; i += 1) {
      const t = i / (arcSegments - 1);
      curve.getPoint(t, tmp);
      pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }
    pos.needsUpdate = true;
  });

  if (!visible || points.length < 2) return null;

  return (
    <line ref={lineRef} geometry={geoRef.current}>
      <lineBasicMaterial color={color} transparent opacity={0.85} />
    </line>
  );
}
