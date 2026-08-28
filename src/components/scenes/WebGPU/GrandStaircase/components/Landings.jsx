import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  Fn,
  attribute,
  normalLocal,
  positionLocal,
  color as tslColor,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_LANDINGS } from '../utils/landings';
import { sampleSlice, shaftFrame } from '../utils/profileNodes';
import buildSurfaceColor from '../utils/surfaceNodes';

function Landings({ config, shaft }) {
  const { uniforms } = shaft;

  const thickness = useMemo(() => uniform(config.landingThickness), []);
  const baseColor = useMemo(() => uniform(tslColor(config.stoneColor)), []);

  useEffect(() => {
    thickness.value = config.landingThickness;
  }, [config.landingThickness, thickness]);

  const geometry = useMemo(() => {
    const next = new THREE.BoxGeometry(1, 1, 1, 1, 1, 32);
    next.setAttribute('aLanding', shaft.landingAttribute);
    return next;
  }, [shaft.landingAttribute]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    const next = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 1,
      side: THREE.DoubleSide,
    });

    const place = () => {
      const landing = attribute('aLanding', 'vec4');
      const s = landing.x;
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
      const dTheta = positionLocal.z.mul(landing.z.mul(2));
      const cosD = dTheta.cos();
      const sinD = dTheta.sin();
      const cosT = frame.cosA.mul(cosD).sub(frame.sinA.mul(sinD));
      const sinT = frame.sinA.mul(cosD).add(frame.cosA.mul(sinD));
      return {
        frame,
        s,
        radial: vec3(cosT, 0, sinT),
        tangent: vec3(sinT.negate(), 0, cosT),
      };
    };

    next.positionNode = Fn(() => {
      const { frame, s, radial } = place();
      const width = uniforms.stairWidth.mul(uniforms.landingWidthScale);
      const radius = frame.voidRadius.add(positionLocal.x.add(0.5).mul(width));
      const top = uniforms.aboveCamera.sub(s);
      return vec3(frame.axisX, top, frame.axisZ)
        .add(radial.mul(radius))
        .add(vec3(0, positionLocal.y.sub(0.5).mul(thickness), 0));
    })();

    next.normalNode = Fn(() => {
      const { radial, tangent } = place();
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
  }, [baseColor, shaft, thickness, uniforms]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    baseColor.value.set(config.stoneColor);
  }, [baseColor, config.stoneColor]);

  const meshRef = useRef(null);

  const attachMesh = useCallback((mesh) => {
    meshRef.current = mesh;
    if (!mesh) return;
    const identity = new THREE.Matrix4();
    const { instanceMatrix } = mesh;
    for (let i = 0; i < MAX_LANDINGS; i += 1) mesh.setMatrixAt(i, identity);
    instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh) mesh.count = shaft.landingCountRef.current;
  });

  return (
    <instancedMesh
      args={[geometry, material, MAX_LANDINGS]}
      frustumCulled={false}
      ref={attachMesh}
    />
  );
}

export default memo(Landings);
