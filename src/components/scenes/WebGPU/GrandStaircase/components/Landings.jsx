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
    next.setAttribute('aLandingAxis', shaft.landingAxisAttribute);
    return next;
  }, [shaft.landingAttribute, shaft.landingAxisAttribute]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    const next = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 1,
      side: THREE.DoubleSide,
    });

    const place = () => {
      const landing = attribute('aLanding', 'vec4');
      const axis = attribute('aLandingAxis', 'vec4');
      const dTheta = positionLocal.z.add(0.5).mul(landing.y);
      const cosD = dTheta.cos();
      const sinD = dTheta.sin();
      const cosT = landing.z.mul(cosD).sub(landing.w.mul(sinD));
      const sinT = landing.w.mul(cosD).add(landing.z.mul(sinD));
      return {
        axis,
        height: landing.x,
        radial: vec3(cosT, 0, sinT),
        tangent: vec3(sinT.negate(), 0, cosT),
      };
    };

    next.positionNode = Fn(() => {
      const { axis, height, radial } = place();
      const width = uniforms.stairWidth.mul(uniforms.landingWidthScale);
      const radius = axis.z.add(positionLocal.x.add(0.5).mul(width));
      const top = uniforms.aboveCamera.sub(height);
      return vec3(axis.x, top, axis.y)
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
      spin: uniforms.spin,
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
