import React, { memo, useEffect, useMemo } from 'react';

import {
  Fn,
  Loop,
  abs,
  float,
  int,
  ivec2,
  max,
  oneMinus,
  step,
  textureLoad,
  color as tslColor,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_MOUTHS } from '../utils/landings';
import { sampleSlice, shaftFrame } from '../utils/profileNodes';
import buildSurfaceColor from '../utils/surfaceNodes';

const TAU = Math.PI * 2;

function ShaftWall({ config, shaft }) {
  const { uniforms } = shaft;
  const baseColor = useMemo(() => uniform(tslColor(config.wallColor)), []);

  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        1,
        1,
        1,
        config.wallRadialSegments,
        config.wallHeightSegments,
        true
      ),
    [config.wallHeightSegments, config.wallRadialSegments]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    const next = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 1,
      side: THREE.BackSide,
    });

    const wallPoint = (s) => {
      const frame = shaftFrame(
        sampleSlice(
          shaft.axisTexture,
          s,
          uniforms.windowDepth,
          uniforms.sliceCount
        ),
        sampleSlice(
          shaft.angleTexture,
          s,
          uniforms.windowDepth,
          uniforms.sliceCount
        )
      );
      const radius = frame.voidRadius
        .add(uniforms.stairWidth)
        .add(uniforms.wallGap);
      const phi = uv().x.mul(TAU);
      const radial = vec3(phi.cos(), 0, phi.sin());
      return {
        radial,
        position: vec3(
          frame.axisX,
          uniforms.aboveCamera.sub(s),
          frame.axisZ
        ).add(radial.mul(radius)),
      };
    };

    const sAt = () => float(1).sub(uv().y).mul(uniforms.windowDepth);

    next.positionNode = Fn(() => wallPoint(sAt()).position)();

    next.normalNode = Fn(() => {
      const s = sAt();
      const here = wallPoint(s);
      const down = wallPoint(s.add(0.5))
        .position.sub(here.position)
        .normalize();
      const phi = uv().x.mul(TAU);
      const tangential = vec3(phi.sin().negate(), 0, phi.cos());
      const normal = down.cross(tangential).normalize();
      return normal.mul(normal.dot(here.radial.negate()).sign());
    })();

    next.alphaTest = 0.5;
    next.opacityNode = Fn(() => {
      const s = sAt();
      const phi = uv().x.mul(TAU);
      const hidden = float(0).toVar();
      Loop(MAX_MOUTHS, ({ i }) => {
        const mouth = textureLoad(shaft.mouthTexture, ivec2(int(i), int(0)));
        const dPhi = phi
          .sub(mouth.y)
          .add(Math.PI * 3)
          .mod(TAU)
          .sub(Math.PI);
        hidden.assign(
          max(
            hidden,
            step(abs(s.sub(mouth.x)), mouth.z).mul(step(abs(dPhi), mouth.w))
          )
        );
      });
      return oneMinus(hidden);
    })();

    next.colorNode = buildSurfaceColor({
      baseColor,
      descent: uniforms.descent,
      surface: shaft.surface,
    });

    return next;
  }, [baseColor, shaft, uniforms]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    baseColor.value.set(config.wallColor);
  }, [baseColor, config.wallColor]);

  return <mesh args={[geometry, material]} frustumCulled={false} />;
}

export default memo(ShaftWall);
