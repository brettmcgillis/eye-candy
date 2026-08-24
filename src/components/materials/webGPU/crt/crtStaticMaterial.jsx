import React, { useEffect, useMemo } from 'react';

import { extend, useFrame } from '@react-three/fiber';

import { FrontSide } from 'three';
import { Fn, mix, step, uniform, uv, vec2, vec3 } from 'three/tsl';
import * as THREE_WEBGPU from 'three/webgpu';

import {
  clamp01Node,
  curveUvNode,
  fbm2Node,
  hash21Node,
  staticNoiseNode,
  vignetteFactorNode,
} from './crtSharedNodes';

extend(THREE_WEBGPU);

function buildStaticColorNode(uniforms) {
  return Fn(() => {
    const inputUv = curveUvNode(uv(), uniforms.curvature);
    const edgeMask = step(0.0, inputUv.x)
      .mul(step(inputUv.x, 1.0))
      .mul(step(0.0, inputUv.y))
      .mul(step(inputUv.y, 1.0));

    const snapTime = uniforms.time
      .mul(uniforms.snowSpeed)
      .mul(uniforms.snap)
      .floor()
      .div(uniforms.snap);
    const pixelUv = inputUv
      .mul(uniforms.snowSize)
      .floor()
      .div(uniforms.snowSize);
    const snowField = fbm2Node(
      pixelUv
        .mul(uniforms.snowScale)
        .add(vec2(snapTime.mul(1.2), snapTime.mul(-0.7)))
    )
      .mul(0.5)
      .add(0.5);

    const bandNoise = staticNoiseNode(
      inputUv,
      uniforms.time,
      uniforms.bandScale,
      uniforms.bandSpeed
    );
    const rfNoise = fbm2Node(
      vec2(inputUv.y.mul(uniforms.rfScale), uniforms.time.mul(uniforms.rfSpeed))
    ).abs();

    const snow = clamp01Node(
      snowField
        .add(bandNoise.mul(uniforms.bandStrength))
        .add(rfNoise.mul(uniforms.rfStrength))
        .add(
          hash21Node(inputUv.mul(500.0).add(uniforms.time.mul(60.0))).mul(0.1)
        )
    );

    const color = vec3(snow).mul(
      vignetteFactorNode(inputUv, uniforms.vignette)
    );
    return mix(vec3(0.0), color, uniforms.snowAmount).mul(edgeMask);
  });
}

export default function CRTStaticMaterial({
  snowAmount = 1,
  snowScale = 180,
  snowSpeed = 1,
  snowSize = 240,
  curvature = 0.12,
  vignette = 0.75,
  bandStrength = 0.35,
  bandSpeed = 0.6,
  bandScale = 8,
  snap = 24,
  rfStrength = 0.25,
  rfScale = 22,
  rfSpeed = 0.4,
  side = FrontSide,
}) {
  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      snowAmount: uniform(snowAmount),
      snowScale: uniform(snowScale),
      snowSpeed: uniform(snowSpeed),
      snowSize: uniform(snowSize),
      snap: uniform(snap),
      bandStrength: uniform(bandStrength),
      bandSpeed: uniform(bandSpeed),
      bandScale: uniform(bandScale),
      rfStrength: uniform(rfStrength),
      rfScale: uniform(rfScale),
      rfSpeed: uniform(rfSpeed),
      curvature: uniform(curvature),
      vignette: uniform(vignette),
    }),
    []
  );

  useEffect(() => {
    uniforms.snowAmount.value = snowAmount;
    uniforms.snowScale.value = snowScale;
    uniforms.snowSpeed.value = snowSpeed;
    uniforms.snowSize.value = snowSize;
    uniforms.snap.value = snap;
    uniforms.bandStrength.value = bandStrength;
    uniforms.bandSpeed.value = bandSpeed;
    uniforms.bandScale.value = bandScale;
    uniforms.rfStrength.value = rfStrength;
    uniforms.rfScale.value = rfScale;
    uniforms.rfSpeed.value = rfSpeed;
    uniforms.curvature.value = curvature;
    uniforms.vignette.value = vignette;
  }, [
    bandScale,
    bandSpeed,
    bandStrength,
    curvature,
    rfScale,
    rfSpeed,
    rfStrength,
    snowAmount,
    snowScale,
    snowSize,
    snowSpeed,
    snap,
    uniforms,
    vignette,
  ]);

  const material = useMemo(() => {
    const nextMaterial = new THREE_WEBGPU.MeshBasicNodeMaterial({
      side,
      toneMapped: false,
    });

    nextMaterial.colorNode = buildStaticColorNode(uniforms)();
    return nextMaterial;
  }, [side, uniforms]);

  useFrame(({ clock }) => {
    uniforms.time.value = clock.getElapsedTime();
  });

  return <primitive object={material} attach="material" />;
}
