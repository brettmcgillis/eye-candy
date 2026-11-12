import React, { useEffect, useMemo } from 'react';

import {
  color,
  float,
  instanceIndex,
  mix,
  smoothstep,
  uniform,
  uv,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createPaintState } from '@modules/paintedRender';

const PATCHES = [
  [-0.27, 0.02, 0.22, 0.15],
  [0.02, -0.04, 0.2, 0.12],
  [0.24, 0.04, 0.18, 0.13],
  [-0.1, 0.17, 0.19, 0.08],
  [0.17, -0.18, 0.16, 0.08],
  [-0.39, -0.11, 0.11, 0.09],
];

export default function PaintedGround({ config, floorY }) {
  const painting = useMemo(createPaintState, []);
  const colors = useMemo(
    () => [uniform(new THREE.Color()), uniform(new THREE.Color())],
    []
  );
  const ground = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
    });
    const at = uv().sub(0.5).mul(2);
    const deposit = painting.field(
      uv().mul(5),
      instanceIndex.toVarying().add(3001)
    ).r;
    const shape = float(1).sub(
      smoothstep(0.35, 1.1, at.length().add(deposit.sub(0.3).mul(0.4)))
    );
    material.colorNode = mix(
      painting.colorFor(
        mix(color('#345c47'), colors[0], painting.u.followPalette),
        0
      ),
      painting.colorFor(
        mix(color('#91a66d'), colors[1], painting.u.followPalette),
        1
      ),
      deposit.mul(2).clamp(0, 1)
    );
    const native = painting.washMark(uv(), instanceIndex.toVarying().add(3001));
    material.opacityNode = mix(
      shape.mul(deposit.mul(0.9).add(0.28)).mul(0.95),
      native.r
        .mul(1.8)
        .add(native.b.mul(painting.u.pooling))
        .clamp(0, 1)
        .mul(0.85),
      painting.u.bleed
    );
    material.toneMapped = false;
    const mesh = new THREE.InstancedMesh(geometry, material, PATCHES.length);
    const transform = new THREE.Object3D();
    PATCHES.forEach(([x, z, rx, rz], index) => {
      transform.position.set(x, -z, 0);
      transform.scale.set(rx * 2, rz * 2, 1);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.userData.plot = false;
    return mesh;
  }, [painting, colors]);
  useEffect(() => {
    painting.apply(config);
    colors[0].value.set(config.grassRootColor);
    colors[1].value.set(config.grassTipColor);
  }, [painting, config, colors]);
  useEffect(
    () => () => {
      ground.geometry.dispose();
      ground.material.dispose();
      ground.dispose();
      painting.dispose();
    },
    [ground, painting]
  );
  return (
    <primitive
      object={ground}
      rotation-x={-Math.PI / 2}
      position-y={floorY + 0.0003}
    />
  );
}
