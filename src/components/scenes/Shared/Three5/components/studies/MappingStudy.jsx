import React, { memo, useEffect, useMemo, useRef } from 'react';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { Euler, Mesh, Raycaster, Vector3 } from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

import { meshFaces, studyGeometry } from '../../utils/studyGeometry';
import { bakeTriplanar, triangleAtlas } from '../../utils/triangleAtlas';
import Comparison from './Comparison';

function MappingSample({ config, assets, mode, time }) {
  const root = useRef();
  const tick = useRef(-Infinity);
  const data = useMemo(() => {
    const geometry = studyGeometry(config.studyShape);
    const faces = meshFaces(geometry);
    const atlas = triangleAtlas(geometry);
    const uvGeometry = studyGeometry(config.studyShape);
    const mesh = new Mesh(uvGeometry);
    const hits = new Raycaster(
      new Vector3(config.decalX, config.decalY, 6),
      new Vector3(0, 0, -1)
    ).intersectObject(mesh);
    const hit = hits[0];
    const rotation = new Euler();
    if (hit) {
      mesh.lookAt(hit.face.normal);
      rotation.copy(mesh.rotation);
      mesh.rotation.set(0, 0, 0);
      mesh.updateMatrixWorld();
    }
    const decal = hit
      ? new DecalGeometry(
          mesh,
          hit.point,
          rotation,
          new Vector3(config.decalSize, config.decalSize, config.decalSize)
        )
      : null;
    return { geometry, faces, atlas, uvGeometry, decal };
  }, [config.studyShape, config.decalX, config.decalY, config.decalSize]);
  useEffect(() => {
    tick.current = -Infinity;
  }, [config, assets]);
  useEffect(
    () => () => {
      data.geometry.dispose();
      data.uvGeometry.dispose();
      data.decal?.dispose();
      data.atlas.texture.dispose();
    },
    [data]
  );
  useFrame(({ clock }) => {
    root.current.rotation.set(0.16, time.current, 0);
    root.current.updateWorldMatrix(true, false);
    if (mode === 'original' || config.mappingMode !== 'triplanar') return;
    if (
      tick.current !== -Infinity &&
      (!config.mappingWorld ||
        !config.studyMotion ||
        clock.elapsedTime - tick.current < 0.25)
    )
      return;
    tick.current = clock.elapsedTime;
    bakeTriplanar(
      data.atlas,
      data.faces,
      assets.main,
      config,
      config.mappingWorld ? root.current.matrixWorld : null
    );
  });
  const triplanar = mode !== 'original' && config.mappingMode === 'triplanar';
  const decal = mode !== 'original' && config.mappingMode === 'decal';
  let map = assets.mainTexture;
  if (triplanar) map = data.atlas.texture;
  if (decal) map = null;
  return (
    <group ref={root}>
      <mesh geometry={triplanar ? data.geometry : data.uvGeometry}>
        <meshStandardMaterial
          key={`${mode}-${config.mappingMode}`}
          map={map}
          color={decal ? '#eee4d6' : '#ffffff'}
          roughness={0.9}
          colorWrite={mode !== 'treatment' || !decal}
        />
      </mesh>
      {decal && !data.decal && (
        <Html center>
          <span className="three5-comparison-label">
            Projector misses the mesh · move horizontal / vertical
          </span>
        </Html>
      )}
      {decal && data.decal && (
        <mesh geometry={data.decal}>
          <meshStandardMaterial
            map={assets.spriteTexture}
            transparent
            alphaTest={0.03}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            roughness={0.9}
          />
        </mesh>
      )}
    </group>
  );
}
const Sample = memo(MappingSample);
function MappingStudy({ config, ...props }) {
  return (
    <Comparison
      config={config}
      sourceLabel="UV unwrap"
      treatmentLabel={config.mappingMode}
    >
      {(mode, time) => (
        <Sample config={config} {...props} mode={mode} time={time} />
      )}
    </Comparison>
  );
}
export default memo(MappingStudy);
