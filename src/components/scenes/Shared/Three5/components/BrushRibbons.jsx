import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Matrix4,
  Vector3,
} from 'three';

import { createRibbonGeometry, updateRibbons } from '../utils/ribbons';

function BrushRibbons({ paths, assets, config }) {
  const geometry = useMemo(() => createRibbonGeometry(paths), [paths]);
  const mesh = useRef();
  const matrix = useRef(new Matrix4());
  const world = useRef(new Matrix4());
  const localCamera = useMemo(() => ({ position: new Vector3() }), []);
  const dirty = useRef(true);
  const clean = useMemo(() => {
    const points = [];
    paths.forEach((path) => {
      for (let i = 1; i < path.length; i += 1)
        points.push(...path[i - 1], ...path[i]);
    });
    const output = new BufferGeometry();
    output.setAttribute('position', new Float32BufferAttribute(points, 3));
    return output;
  }, [paths]);
  useEffect(() => {
    dirty.current = true;
  }, [config.ribbonWidth, config.faceCamera, config.growth, geometry]);
  useEffect(
    () => () => {
      geometry.dispose();
      clean.dispose();
    },
    [geometry, clean]
  );
  useFrame(({ camera }) => {
    mesh.current.updateWorldMatrix(true, false);
    if (
      !dirty.current &&
      matrix.current.equals(camera.matrixWorld) &&
      world.current.equals(mesh.current.matrixWorld)
    )
      return;
    localCamera.position.copy(camera.position);
    mesh.current.worldToLocal(localCamera.position);
    updateRibbons(
      geometry,
      localCamera,
      config.ribbonWidth,
      config.faceCamera,
      config.growth
    );
    matrix.current.copy(camera.matrixWorld);
    world.current.copy(mesh.current.matrixWorld);
    dirty.current = false;
  });
  return (
    <>
      <mesh ref={mesh} geometry={geometry} frustumCulled={false}>
        <meshBasicMaterial
          map={assets.strokeTexture}
          transparent
          alphaTest={0.005}
          side={DoubleSide}
          depthWrite={config.depthWrite}
          toneMapped={false}
        />
      </mesh>
      {config.cleanLines && (
        <lineSegments geometry={clean}>
          <lineBasicMaterial
            color="#dc8058"
            depthTest={false}
            transparent
            opacity={0.6}
          />
        </lineSegments>
      )}
    </>
  );
}

export default memo(BrushRibbons);
