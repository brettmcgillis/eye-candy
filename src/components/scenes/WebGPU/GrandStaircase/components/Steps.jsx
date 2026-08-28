import React, { memo, useCallback, useEffect, useMemo } from 'react';

import {
  Fn,
  float,
  instanceIndex,
  normalLocal,
  oneMinus,
  positionLocal,
  step,
  color as tslColor,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { sampleSlice, shaftFrame } from '../utils/profileNodes';
import buildSurfaceColor from '../utils/surfaceNodes';

function Steps({ config, shaft }) {
  const { uniforms } = shaft;

  const thickness = useMemo(() => uniform(config.stepThickness), []);
  const nosing = useMemo(() => uniform(config.stepNosing), []);
  const baseColor = useMemo(() => uniform(tslColor(config.stoneColor)), []);

  useEffect(() => {
    thickness.value = config.stepThickness;
    nosing.value = config.stepNosing;
  }, [config.stepNosing, config.stepThickness, nosing, thickness]);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const material = useMemo(() => {
    const next = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 1,
    });

    const sample = () => {
      const s = uniforms.sBase.add(float(instanceIndex).mul(uniforms.riser));
      const axisSample = sampleSlice(
        shaft.axisTexture,
        s,
        uniforms.windowDepth,
        uniforms.sliceCount
      );
      const frame = shaftFrame(
        axisSample,
        sampleSlice(
          shaft.angleTexture,
          s,
          uniforms.windowDepth,
          uniforms.sliceCount
        )
      );
      const midRadius = frame.voidRadius.add(uniforms.stairWidth.mul(0.5));
      return {
        s,
        frame,
        midRadius,
        live: oneMinus(step(0.5, axisSample.w)),
        radial: vec3(frame.cosA, 0, frame.sinA),
        tangent: vec3(frame.sinA.negate(), 0, frame.cosA),
        tread: frame.angleRate
          .abs()
          .mul(uniforms.riser)
          .mul(midRadius)
          .mul(nosing),
      };
    };

    next.positionNode = Fn(() => {
      const { s, frame, radial, tangent, midRadius, tread, live } = sample();
      const height = uniforms.riser.mul(thickness);
      const local = positionLocal.mul(live);
      return vec3(frame.axisX, uniforms.aboveCamera.sub(s), frame.axisZ)
        .add(
          radial.mul(midRadius.mul(live).add(local.x.mul(uniforms.stairWidth)))
        )
        .add(tangent.mul(local.z.mul(tread)))
        .add(vec3(0, local.y.mul(height).sub(height.mul(0.5).mul(live)), 0));
    })();

    next.normalNode = Fn(() => {
      const { radial, tangent } = sample();
      return radial
        .mul(normalLocal.x)
        .add(vec3(0, normalLocal.y, 0))
        .add(tangent.mul(normalLocal.z))
        .normalize();
    })();

    next.colorNode = buildSurfaceColor({
      baseColor,
      descent: uniforms.descent,
      surface: shaft.surface,
    });

    return next;
  }, [baseColor, nosing, shaft, thickness, uniforms]);

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    baseColor.value.set(config.stoneColor);
  }, [baseColor, config.stoneColor]);

  // Instancing assigns `positionLocal = instanceMatrix * positionLocal` before
  // positionNode runs, and InstancedMesh ships a zero-filled matrix buffer.
  const seedIdentity = useCallback((mesh) => {
    if (!mesh) return;
    const identity = new THREE.Matrix4();
    const { instanceMatrix } = mesh;
    for (let i = 0; i < mesh.count; i += 1) mesh.setMatrixAt(i, identity);
    instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      args={[geometry, material, shaft.instanceCount]}
      frustumCulled={false}
      key={shaft.instanceCount}
      ref={seedIdentity}
    />
  );
}

export default memo(Steps);
