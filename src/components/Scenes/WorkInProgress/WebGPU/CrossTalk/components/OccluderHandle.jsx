import * as THREE from 'three/webgpu';

import React, { memo, useMemo } from 'react';

import usePointDrag from '../hooks/usePointDrag';
import {
  OCCLUDER_BOX,
  OCCLUDER_CIRCLE,
  OCCLUDER_TRIANGLE,
} from '../utils/sceneTSL';

const OCCLUDER_COLOR = '#d97722';

// Equilateral triangle, circumradius 1 (matches sdEquilateralTriangle's `r`
// closely enough for a drag-handle preview — not required to be pixel-exact
// with the SDF boundary the shader actually lights against).
const TRIANGLE_SHAPE = new THREE.Shape();
TRIANGLE_SHAPE.moveTo(0, 1);
TRIANGLE_SHAPE.lineTo(-0.866, -0.5);
TRIANGLE_SHAPE.lineTo(0.866, -0.5);
TRIANGLE_SHAPE.closePath();
const TRIANGLE_GEOMETRY = new THREE.ShapeGeometry(TRIANGLE_SHAPE);

// The flat, draggable occluder shape at this window's occluder position —
// same "whole shape is the hit target" reasoning as GravityArrow.jsx, and
// the same DoubleSide requirement (DesktopStage's ortho camera is
// Y-flipped, which reverses triangle winding — see that file's comment).
function OccluderHandle({
  center,
  draggable,
  onDrag,
  rect,
  rotation,
  shape,
  size,
}) {
  const dragHandlers = usePointDrag({ draggable, onDrag, rect });
  const rotationZ = useMemo(() => rotation, [rotation]);

  return (
    <group position={[center.x, center.y, 1]} rotation={[0, 0, rotationZ]}>
      {shape === OCCLUDER_CIRCLE && (
        <mesh {...dragHandlers} scale={size}>
          <circleGeometry args={[1, 24]} />
          <meshBasicMaterial
            color={OCCLUDER_COLOR}
            depthWrite={false}
            opacity={0.85}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      )}
      {shape === OCCLUDER_BOX && (
        <mesh {...dragHandlers} scale={[size * 2, size * 2, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={OCCLUDER_COLOR}
            depthWrite={false}
            opacity={0.85}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      )}
      {shape === OCCLUDER_TRIANGLE && (
        <mesh {...dragHandlers} geometry={TRIANGLE_GEOMETRY} scale={size}>
          <meshBasicMaterial
            color={OCCLUDER_COLOR}
            depthWrite={false}
            opacity={0.85}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      )}
    </group>
  );
}

export default memo(OccluderHandle);
