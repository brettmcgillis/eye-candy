import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { BufferAttribute, BufferGeometry, DoubleSide, Vector3 } from 'three';

import {
  finishRibbons,
  streamGeometry,
  writeRibbon,
} from '../../utils/streamRibbons';

function Gesture({ stroke, config, original, root }) {
  const data = useMemo(
    () => ({
      ribbon: streamGeometry(512),
      line: new BufferGeometry().setAttribute(
        'position',
        new BufferAttribute(new Float32Array(3072), 3)
      ),
      camera: new Vector3(),
    }),
    []
  );
  useEffect(
    () => () => {
      data.ribbon.dispose();
      data.line.dispose();
    },
    [data]
  );
  useFrame(({ camera }) => {
    if (!root.current) return;
    data.camera.copy(camera.position);
    root.current.worldToLocal(data.camera);
    const { points } = stroke;
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      writeRibbon(
        data.ribbon,
        i - 1,
        a.point,
        b.point,
        data.camera,
        stroke.width,
        (i - 1) / Math.max(1, points.length - 1),
        i / Math.max(1, points.length - 1),
        a.pressure,
        b.pressure
      );
      data.line.attributes.position.setXYZ(
        (i - 1) * 2,
        a.point.x,
        a.point.y,
        a.point.z
      );
      data.line.attributes.position.setXYZ(
        (i - 1) * 2 + 1,
        b.point.x,
        b.point.y,
        b.point.z
      );
    }
    finishRibbons(data.ribbon, points.length - 1);
    data.line.setDrawRange(0, (points.length - 1) * 2);
    data.line.attributes.position.needsUpdate = true;
  });
  return original ? (
    <lineSegments geometry={data.line} frustumCulled={false}>
      <lineBasicMaterial color="#cb634c" depthTest={config.spaceOcclusion} />
    </lineSegments>
  ) : (
    <mesh geometry={data.ribbon} frustumCulled={false}>
      <meshBasicMaterial
        map={stroke.texture}
        side={DoubleSide}
        transparent
        alphaTest={0.005}
        depthWrite={false}
        depthTest={config.spaceOcclusion}
        toneMapped={false}
      />
    </mesh>
  );
}
export default memo(Gesture);
