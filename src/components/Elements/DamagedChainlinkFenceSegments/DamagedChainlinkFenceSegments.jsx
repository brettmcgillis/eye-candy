import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

const TILT = [-Math.PI / 2, 0, 0];
const WIRE_TILT = [-Math.PI / 2, Math.PI / 2, 0];
const S = 0.923;

// The pack is 4 fence panels (plus a broken end with loose wire scraps)
// laid along -z. Re-exposed per segment, each centered at the origin, so a
// scene can run them along its own terrain with gaps, lean, and yaw
// instead of plopping the whole 17m strip down at once.
const SEGMENTS = [
  {
    center: 0.7,
    parts: [
      { node: 'Cylinder_Material001_0', position: [0, 0, 1.435], tilt: true },
      { node: 'Cube_Material001_0', position: [0, 0, 1.391], tilt: true },
      {
        node: 'Cylinder001_Material001_0',
        position: [0, 1.729, 1.435],
        tilt: true,
      },
      { node: 'Cylinder002_Material001_0', position: [0, 0.955, 0] },
    ],
  },
  {
    center: -3.2,
    parts: [
      {
        node: 'Cylinder003_Material001_0',
        position: [0, 0, -2.568],
        tilt: true,
      },
      { node: 'Cube001_Material001_0', position: [0, 0, -2.613], tilt: true },
      {
        node: 'Cylinder004_Material001_0',
        position: [0, 1.729, -2.568],
        tilt: true,
      },
      { node: 'Cylinder005_Material001_0', position: [0, 0.955, -4.003] },
    ],
  },
  {
    center: -6.9,
    parts: [
      {
        node: 'Cylinder006_Material001_0',
        position: [0, 0, -6.26],
        tilt: true,
      },
      { node: 'Cube002_Material001_0', position: [0, 0, -6.305], tilt: true },
      {
        node: 'Cylinder007_Material001_0',
        position: [0, 1.729, -6.26],
        tilt: true,
      },
      { node: 'Cylinder008_Material001_0', position: [0, 0.955, -7.696] },
    ],
  },
  {
    center: -10.9,
    parts: [
      {
        node: 'Cylinder009_Material001_0',
        position: [0, 0, -10.218],
        tilt: true,
      },
      { node: 'Cube003_Material001_0', position: [0, 0, -10.263], tilt: true },
      {
        node: 'Cylinder010_Material001_0',
        position: [0, 1.729, -10.218],
        tilt: true,
      },
      { node: 'Cylinder011_Material001_0', position: [0, 0.955, -11.653] },
    ],
  },
  {
    center: -14.5,
    parts: [
      {
        node: 'Cylinder012_Material001_0',
        position: [0, 0, -13.818],
        tilt: true,
      },
      { node: 'Cube004_Material001_0', position: [0, 0, -13.863], tilt: true },
      {
        node: 'Cylinder013_Material001_0',
        position: [0, 1.729, -13.818],
        tilt: true,
      },
      { node: 'Cylinder014_Material001_0', position: [0, 0.955, -15.254] },
      {
        node: 'Plane001_Material001_0',
        position: [0, 0.955, -15.254],
        wire: true,
      },
      {
        node: 'Plane002_Material001_0',
        position: [0, 0.955, -15.254],
        wire: true,
      },
      {
        node: 'Plane003_Material001_0',
        position: [0, 0.955, -15.254],
        wire: true,
      },
      {
        node: 'Plane005_Material001_0',
        position: [0, 0.955, -15.254],
        wire: true,
      },
      {
        node: 'Plane006_Material001_0',
        position: [0, 0.955, -15.254],
        wire: true,
      },
    ],
  },
];

export const FENCE_SEGMENT_COUNT = SEGMENTS.length;

export function FenceSegment({ index = 0, ...props }) {
  const { nodes, materials } = useGLTF(
    modelFile('damaged_chainlink_fence_segments.glb')
  );
  const segment = SEGMENTS[index % SEGMENTS.length];
  return (
    <group {...props} dispose={null}>
      <group position={[0, 0, -segment.center]}>
        {segment.parts.map((part) => {
          let rotation;
          if (part.wire) rotation = WIRE_TILT;
          else if (part.tilt) rotation = TILT;
          return (
            <mesh
              key={part.node}
              castShadow
              receiveShadow
              geometry={nodes[part.node].geometry}
              material={materials['Material.001']}
              position={part.position}
              rotation={rotation}
              scale={S}
            />
          );
        })}
      </group>
    </group>
  );
}

// Original full run, unchanged below.
export default function DamagedChainlinkFenceSegments(props) {
  const { nodes, materials } = useGLTF(
    modelFile('damaged_chainlink_fence_segments.glb')
  );
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, 1.435]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder003_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -2.568]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder006_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -6.26]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder009_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -10.218]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder012_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -13.818]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, 1.391]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube001_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -2.613]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube002_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -6.305]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube003_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -10.263]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube004_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -13.863]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder001_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, 1.435]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder004_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, -2.568]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder007_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, -6.26]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder010_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, -10.218]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder013_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, -13.818]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder002_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -4.003]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder008_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -7.696]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder011_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -11.653]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder014_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane001_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane002_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane003_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane005_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane006_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
    </group>
  );
}

useGLTF.preload(modelFile('damaged_chainlink_fence_segments.glb'));
