import React, { useEffect, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { Color, DoubleSide } from 'three';
import {
  cos,
  mix,
  normalLocal,
  positionLocal,
  sin,
  step,
  texture,
  uniform,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { modelFile } from '@utils/appUtils';

// Single egg from egg.glb. The model has NO UVs or texture (just POSITION + NORMAL),
// and the geometry is centered near the origin (~±0.19 in X/Y, long axis along Z in
// [-0.23, 0.28]).
//
// Pass `decalMap` to stamp a texture once onto the shell. Because there are no UVs to
// map against, we build a MeshStandardNodeMaterial that PROJECTS the texture planar-
// style from object space (the YZ plane → the egg's +X side) and masks it to a single
// patch — no tiling, no extra geometry, no Decal projection. All placement is tunable:
//   decalScale  patch size in egg-local units
//   decalU/V    slide along the egg's Z / Y axes
//   decalSpin   rotate the sticker in-plane (radians)
// Omit `decalMap` and the egg renders with its plain GLTF material, so it stays generic
// (any scene can stamp its own sticker — a QR code, a logo, a price tag…).
export default function Egg({
  decalMap,
  decalScale = 0.22,
  decalU = 0.02,
  decalV = 0,
  decalSpin = 0,
  baseColor = '#ece4d2',
  ...props
}) {
  const { nodes, materials } = useGLTF(modelFile('egg.glb'));

  const u = useMemo(
    () => ({
      scale: uniform(0.22),
      u: uniform(0.02),
      v: uniform(0),
      spin: uniform(0),
      base: uniform(new Color('#ece4d2')),
    }),
    []
  );

  const decalMaterial = useMemo(() => {
    if (!decalMap) return null;
    const m = new THREE.MeshStandardNodeMaterial({
      roughness: 0.6,
      metalness: 0,
      side: DoubleSide,
    });

    // Planar projection onto the YZ plane → the egg's +X side. positionLocal /
    // normalLocal are raw geometry coords, so this rides along with any rotation
    // or scale applied to the egg group.
    const p = positionLocal;
    const d = vec2(p.z.sub(u.u), p.y.sub(u.v)).div(u.scale);
    const c = cos(u.spin);
    const s = sin(u.spin);
    const uv = vec2(d.x.mul(c).sub(d.y.mul(s)), d.x.mul(s).add(d.y.mul(c))).add(
      0.5
    );

    // Show the sticker only inside the [0,1] patch AND on the +X-facing side, so it
    // lands once (no mirror copy on the far side).
    const inBox = step(0, uv.x)
      .mul(step(uv.x, 1))
      .mul(step(0, uv.y))
      .mul(step(uv.y, 1));
    const front = step(0.05, normalLocal.x);
    const mask = inBox.mul(front);

    const decal = texture(decalMap, uv);
    m.colorNode = mix(u.base, decal.rgb, mask);
    return m;
  }, [decalMap, u]);

  useEffect(() => {
    u.scale.value = decalScale;
    u.u.value = decalU;
    u.v.value = decalV;
    u.spin.value = decalSpin;
    u.base.value.set(baseColor);
  }, [u, decalScale, decalU, decalV, decalSpin, baseColor]);

  useEffect(() => () => decalMaterial?.dispose(), [decalMaterial]);

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={decalMaterial ?? materials.mat_66990170}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('egg.glb'));
