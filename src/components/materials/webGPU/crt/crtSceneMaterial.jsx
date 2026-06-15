import { FrontSide } from 'three';
import {
  Fn,
  float,
  mix,
  pass,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE_WEBGPU from 'three/webgpu';

import React, { useEffect, useMemo, useState } from 'react';

import { createPortal, useFrame, useThree } from '@react-three/fiber';

import {
  curveUvNode,
  staticNoiseNode,
  vignetteFactorNode,
} from './crtSharedNodes';

function PortalCameraCapture({ onCamera }) {
  const { camera } = useThree();

  useEffect(() => {
    onCamera(camera);
  }, [camera, onCamera]);

  return null;
}

function buildSceneColorNode(uniforms, sceneTexture) {
  return Fn(() => {
    const inputUv = curveUvNode(uv(), uniforms.curvature);
    const sampledUv = vec2(inputUv.x, float(1.0).sub(inputUv.y));
    const edgeMask = inputUv.x
      .step(0.0)
      .mul(inputUv.x.oneMinus().step(0.0))
      .mul(inputUv.y.step(0.0))
      .mul(inputUv.y.oneMinus().step(0.0));

    const drift = uniforms.time
      .mul(0.6)
      .add(inputUv.y.mul(4.0))
      .sin()
      .mul(0.002)
      .mul(uniforms.chromaDrift);

    const red = texture(sceneTexture, sampledUv.add(vec2(drift, 0.0))).r;
    const green = texture(sceneTexture, sampledUv).g;
    const blue = texture(sceneTexture, sampledUv.sub(vec2(drift, 0.0))).b;

    const sourceColor = vec3(red, green, blue);
    const noise = staticNoiseNode(
      inputUv,
      uniforms.time,
      uniforms.staticScale,
      uniforms.staticSpeed
    );

    const scanline = inputUv.y
      .mul(900.0)
      .sin()
      .mul(0.04)
      .mul(uniforms.scanlineStrength);

    const crted = mix(sourceColor, vec3(noise), uniforms.staticAmount).sub(
      vec3(scanline)
    );

    const luma = crted.dot(vec3(0.299, 0.587, 0.114));
    const bloomGain = smoothstep(0.6, 1.0, luma).mul(uniforms.bloom);
    const postBloom = crted.add(crted.mul(bloomGain));

    return postBloom
      .mul(vignetteFactorNode(inputUv, uniforms.vignette))
      .mul(edgeMask);
  });
}

export default function CRTSceneMaterial({
  scene,
  resolution = 1024,
  staticAmount = 0.12,
  staticScale = 600,
  staticSpeed = 6,
  scanlineStrength = 0.4,
  curvature = 0.12,
  vignette = 0.85,
  chromaDrift = 0.25,
  bloom = 0.25,
  side = FrontSide,
}) {
  const { camera: fallbackCamera } = useThree();
  const offscreenScene = useMemo(() => new THREE_WEBGPU.Scene(), []);
  const [portalCamera, setPortalCamera] = useState(null);

  const scenePortal = useMemo(
    () =>
      createPortal(
        <>
          <PortalCameraCapture onCamera={setPortalCamera} />
          {scene}
        </>,
        offscreenScene
      ),
    [offscreenScene, scene]
  );

  const captureCamera = portalCamera || fallbackCamera;

  const scenePass = useMemo(
    () => pass(offscreenScene, captureCamera),
    [captureCamera, offscreenScene]
  );

  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      staticAmount: uniform(staticAmount),
      staticScale: uniform(staticScale),
      staticSpeed: uniform(staticSpeed),
      scanlineStrength: uniform(scanlineStrength),
      curvature: uniform(curvature),
      vignette: uniform(vignette),
      chromaDrift: uniform(chromaDrift),
      bloom: uniform(bloom),
    }),
    []
  );

  useEffect(() => {
    uniforms.staticAmount.value = staticAmount;
    uniforms.staticScale.value = staticScale;
    uniforms.staticSpeed.value = staticSpeed;
    uniforms.scanlineStrength.value = scanlineStrength;
    uniforms.curvature.value = curvature;
    uniforms.vignette.value = vignette;
    uniforms.chromaDrift.value = chromaDrift;
    uniforms.bloom.value = bloom;
  }, [
    bloom,
    chromaDrift,
    curvature,
    scanlineStrength,
    staticAmount,
    staticScale,
    staticSpeed,
    uniforms,
    vignette,
  ]);

  const material = useMemo(() => {
    const nextMaterial = new THREE_WEBGPU.MeshBasicNodeMaterial({
      side,
      toneMapped: false,
    });

    nextMaterial.colorNode = buildSceneColorNode(
      uniforms,
      scenePass.getTextureNode('output')
    )();

    nextMaterial.userData.resolution = resolution;
    return nextMaterial;
  }, [resolution, scenePass, side, uniforms]);

  useFrame(({ clock }) => {
    uniforms.time.value = clock.getElapsedTime();
  });

  useEffect(
    () => () => {
      material.dispose();
    },
    [material]
  );

  return (
    <>
      {scenePortal}
      <primitive object={material} attach="material" />
    </>
  );
}
