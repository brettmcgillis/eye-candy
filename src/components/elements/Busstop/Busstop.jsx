import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

// The four sign panels. `InsideBack` carries the bus route map and is never
// overridden; the other three are advertisement faces that `renderAd` may
// replace with a custom material.
const AD_SIGNS = [
  'BusStop_Sign_InsideRight',
  'BusStop_Sign_OutsideBack',
  'BusStop_Sign_OutsideRight',
];

// The sign faces share a texture atlas, so each one's UVs occupy a different
// sub-rectangle of UV space. Measure that rect so an override material can
// remap it back to a consistent 0..1 box (otherwise scale/offset/centering
// behave differently on every panel).
function uvRect(geometry) {
  const uv = geometry?.attributes?.uv;
  if (!uv) return { origin: { x: 0, y: 0 }, span: { x: 1, y: 1 } };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < uv.count; i += 1) {
    const x = uv.getX(i);
    const y = uv.getY(i);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return {
    origin: { x: minX, y: minY },
    span: { x: maxX - minX || 1, y: maxY - minY || 1 },
  };
}

export default function Busstop({ renderAd, ...props }) {
  const { nodes, materials } = useGLTF(modelFile('busstop.glb'));

  const sign = (name) => {
    const override =
      renderAd && AD_SIGNS.includes(name)
        ? renderAd(name, uvRect(nodes[name].geometry))
        : null;
    return (
      <mesh
        castShadow
        receiveShadow
        geometry={nodes[name].geometry}
        material={override ? undefined : materials['Sign_shader.004']}
        scale={0.01}
      >
        {override}
      </mesh>
    );
  };

  return (
    <group {...props} dispose={null}>
      {sign('BusStop_Sign_InsideBack')}
      {sign('BusStop_Sign_InsideRight')}
      {sign('BusStop_Sign_OutsideBack')}
      {sign('BusStop_Sign_OutsideRight')}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStop_Structure_shader_0.geometry}
        material={materials['Structure_shader.005']}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStopGlassCeiling.geometry}
        material={materials['Structure_shader.006']}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStopGlassWalls.geometry}
        material={materials['Structure_shader.006']}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('busstop.glb'));
