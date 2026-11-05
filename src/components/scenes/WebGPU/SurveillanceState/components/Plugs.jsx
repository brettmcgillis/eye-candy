/* eslint-disable no-param-reassign */
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import * as THREE from 'three/webgpu';

const SHAPES = {
  rca: { length: 0.034, radius: 0.0085, ferrule: '#c9b27a' },
  bnc: { length: 0.03, radius: 0.0095, ferrule: '#b9bcc0' },
};
const UP = new THREE.Vector3(0, 1, 0);

function placements(cables) {
  return cables.flatMap((cable) =>
    cable.plugs.map((plug) => ({ ...plug, sleeve: cable.color }))
  );
}

function writeInstances(mesh, plugs, part) {
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const direction = new THREE.Vector3();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();
  plugs.forEach((plug, i) => {
    const shape = SHAPES[plug.kind];
    const length = part === 'boot' ? shape.length : shape.length * 0.35;
    const offset =
      part === 'boot' ? shape.length * 0.35 + length / 2 : length / 2;
    const radius = part === 'boot' ? shape.radius : shape.radius * 0.8;
    direction.fromArray(plug.direction).normalize();
    quaternion.setFromUnitVectors(UP, direction);
    position.fromArray(plug.position).addScaledVector(direction, offset);
    scale.set(radius, length, radius);
    mesh.setMatrixAt(i, matrix.compose(position, quaternion, scale));
    mesh.setColorAt(
      i,
      color.set(part === 'boot' ? plug.sleeve : shape.ferrule)
    );
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function PlugPart({ plugs, part, geometry, material }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    writeInstances(ref.current, plugs, part);
  }, [part, plugs]);
  return (
    <instancedMesh
      args={[geometry, material, plugs.length]}
      castShadow
      ref={ref}
    />
  );
}

const MemoPlugPart = memo(PlugPart);

function Plugs({ cables }) {
  const plugs = useMemo(() => placements(cables), [cables]);
  const geometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 12), []);
  const boot = useMemo(
    () => new THREE.MeshStandardNodeMaterial({ roughness: 0.5 }),
    []
  );
  const ferrule = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({ roughness: 0.3, metalness: 0.9 }),
    []
  );
  useEffect(
    () => () => {
      geometry.dispose();
      boot.dispose();
      ferrule.dispose();
    },
    [boot, ferrule, geometry]
  );
  if (plugs.length === 0) return null;

  return (
    <group key={plugs.length}>
      <MemoPlugPart
        geometry={geometry}
        material={boot}
        part="boot"
        plugs={plugs}
      />
      <MemoPlugPart
        geometry={geometry}
        material={ferrule}
        part="ferrule"
        plugs={plugs}
      />
    </group>
  );
}

export default memo(Plugs);
