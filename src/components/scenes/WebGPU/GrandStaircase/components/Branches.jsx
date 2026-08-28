import React, { memo, useCallback, useEffect, useMemo } from 'react';

import {
  Fn,
  instanceIndex,
  int,
  ivec2,
  normalLocal,
  positionLocal,
  step,
  textureLoad,
  color as tslColor,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_MOUTHS } from '../utils/landings';
import buildSurfaceColor from '../utils/surfaceNodes';
import createTunnelGeometry from '../utils/tunnelGeometry';

function buildMaterial({
  baseColor,
  shaft,
  isRoom,
  length,
  widen,
  heighten,
  inset,
}) {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 1,
    side: THREE.DoubleSide,
  });

  const place = () => {
    const coord = ivec2(int(instanceIndex), int(0));
    const mouth = textureLoad(shaft.mouthTexture, coord);
    const extra = textureLoad(shaft.mouthExtraTexture, coord);
    const live = isRoom ? extra.x : step(0, mouth.z);
    const cos = mouth.y.cos();
    const sin = mouth.y.sin();
    return {
      live,
      mouth,
      extra,
      radial: vec3(cos, 0, sin),
      tangent: vec3(sin.negate(), 0, cos),
    };
  };

  material.positionNode = Fn(() => {
    const { live, mouth, extra, radial, tangent } = place();
    const width = mouth.w.mul(2).mul(extra.y).mul(widen);
    const height = mouth.z.mul(2).mul(heighten);
    const start = extra.y.add(inset);
    const local = positionLocal.mul(live);
    return vec3(extra.z, shaft.uniforms.aboveCamera.sub(mouth.x), extra.w)
      .add(radial.mul(start.mul(live).add(local.x.mul(length))))
      .add(tangent.mul(local.z.mul(width)))
      .add(vec3(0, local.y.mul(height), 0));
  })();

  material.normalNode = Fn(() => {
    const { radial, tangent } = place();
    return radial
      .mul(normalLocal.x)
      .add(vec3(0, normalLocal.y, 0))
      .add(tangent.mul(normalLocal.z))
      .normalize();
  })();

  material.colorNode = buildSurfaceColor({
    baseColor,
    descent: shaft.uniforms.descent,
    surface: shaft.surface,
  });

  return material;
}

function Branches({ config, shaft }) {
  const geometry = useMemo(() => createTunnelGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const lengths = useMemo(
    () => ({
      tunnel: uniform(config.tunnelLength),
      room: uniform(config.roomDepth),
      roomWiden: uniform(config.roomWiden),
      inset: uniform(0),
      roomInset: uniform(config.tunnelLength),
    }),
    []
  );

  useEffect(() => {
    lengths.tunnel.value = config.tunnelLength;
    lengths.room.value = config.roomDepth;
    lengths.roomWiden.value = config.roomWiden;
    lengths.roomInset.value = config.tunnelLength;
  }, [config.roomDepth, config.roomWiden, config.tunnelLength, lengths]);

  const baseColor = useMemo(() => uniform(tslColor(config.branchColor)), []);

  const tunnelMaterial = useMemo(
    () =>
      buildMaterial({
        baseColor,
        shaft,
        isRoom: false,
        length: lengths.tunnel,
        widen: 1,
        heighten: 1,
        inset: lengths.inset,
      }),
    [baseColor, lengths, shaft]
  );

  const roomMaterial = useMemo(
    () =>
      buildMaterial({
        baseColor,
        shaft,
        isRoom: true,
        length: lengths.room,
        widen: lengths.roomWiden,
        heighten: lengths.roomWiden,
        inset: lengths.roomInset,
      }),
    [baseColor, lengths, shaft]
  );

  useEffect(
    () => () => {
      tunnelMaterial.dispose();
      roomMaterial.dispose();
    },
    [roomMaterial, tunnelMaterial]
  );

  useEffect(() => {
    baseColor.value.set(config.branchColor);
  }, [baseColor, config.branchColor]);

  const seedIdentity = useCallback((mesh) => {
    if (!mesh) return;
    const identity = new THREE.Matrix4();
    const { instanceMatrix } = mesh;
    for (let i = 0; i < MAX_MOUTHS; i += 1) mesh.setMatrixAt(i, identity);
    instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <>
      <instancedMesh
        args={[geometry, tunnelMaterial, MAX_MOUTHS]}
        frustumCulled={false}
        ref={seedIdentity}
      />
      <instancedMesh
        args={[geometry, roomMaterial, MAX_MOUTHS]}
        frustumCulled={false}
        ref={seedIdentity}
      />
    </>
  );
}

export default memo(Branches);
