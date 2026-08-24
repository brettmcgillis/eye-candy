import React, { useEffect, useMemo, useRef } from 'react';

import { extend, useFrame, useThree } from '@react-three/fiber';

import { FrontSide } from 'three';
import {
  Fn,
  mix,
  texture as tslTexture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE_WEBGPU from 'three/webgpu';

import { curveUvNode, hash21Node, vignetteFactorNode } from './crtSharedNodes';

extend(THREE_WEBGPU);

function buildFeedbackColorNode(uniforms, sceneTexture, feedbackTexture) {
  return Fn(() => {
    const inputUv = uv();
    const sampleUv = vec2(inputUv.x, inputUv.y.oneMinus());

    const feedbackUv = inputUv.sub(vec2(0.5)).div(uniforms.zoom).add(vec2(0.5));

    const warpedFeedback = feedbackUv.add(
      vec2(inputUv.y, inputUv.x)
        .mul(6.0)
        .add(uniforms.time.mul(0.4))
        .sin()
        .mul(0.003)
        .mul(uniforms.warp)
    );
    const curvedFeedbackUv = curveUvNode(warpedFeedback, uniforms.curvature);
    const feedbackSampleUv = vec2(
      curvedFeedbackUv.x,
      curvedFeedbackUv.y.oneMinus()
    );

    const sceneColor = tslTexture(sceneTexture, sampleUv).rgb;
    const feedbackColor = tslTexture(feedbackTexture, feedbackSampleUv).rgb;

    const mixed = mix(sceneColor, feedbackColor, uniforms.decay);
    const scanline = inputUv.y
      .mul(900.0)
      .sin()
      .mul(0.04)
      .mul(uniforms.scanlineStrength);
    const noisy = mix(
      mixed.sub(vec3(scanline)),
      vec3(
        hash21Node(inputUv.mul(600.0).add(vec2(uniforms.time, uniforms.time)))
      ),
      uniforms.staticAmount
    );

    const color = noisy.mul(vignetteFactorNode(inputUv, uniforms.vignette));

    return color;
  });
}

export default function CRTSceneInSceneMaterial({
  resolution = 1024,
  decay = 0.85,
  zoom = 1.01,
  warp = 0.6,
  staticAmount = 0.04,
  scanlineStrength = 0.4,
  curvature = 0.12,
  vignette = 0.85,
  side = FrontSide,
}) {
  const { gl, scene, camera } = useThree();

  const sceneRT = useMemo(
    () =>
      new THREE_WEBGPU.RenderTarget(resolution, resolution, {
        depthBuffer: true,
      }),
    [resolution]
  );
  const feedbackA = useMemo(
    () =>
      new THREE_WEBGPU.RenderTarget(resolution, resolution, {
        depthBuffer: true,
      }),
    [resolution]
  );
  const feedbackB = useMemo(
    () =>
      new THREE_WEBGPU.RenderTarget(resolution, resolution, {
        depthBuffer: true,
      }),
    [resolution]
  );

  const swap = useRef(false);
  const initialized = useRef(false);

  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      decay: uniform(decay),
      zoom: uniform(zoom),
      warp: uniform(warp),
      staticAmount: uniform(staticAmount),
      scanlineStrength: uniform(scanlineStrength),
      curvature: uniform(curvature),
      vignette: uniform(vignette),
    }),
    [curvature, decay, scanlineStrength, staticAmount, vignette, warp, zoom]
  );

  const feedbackTextureNode = useMemo(
    () => new THREE_WEBGPU.TextureNode(feedbackA.texture),
    [feedbackA.texture]
  );

  useEffect(
    () => () => {
      sceneRT.dispose();
      feedbackA.dispose();
      feedbackB.dispose();
    },
    [feedbackA, feedbackB, sceneRT]
  );

  useEffect(() => {
    uniforms.decay.value = decay;
    uniforms.zoom.value = zoom;
    uniforms.warp.value = warp;
    uniforms.staticAmount.value = staticAmount;
    uniforms.scanlineStrength.value = scanlineStrength;
    uniforms.curvature.value = curvature;
    uniforms.vignette.value = vignette;
  }, [
    curvature,
    decay,
    scanlineStrength,
    staticAmount,
    uniforms,
    vignette,
    warp,
    zoom,
  ]);

  const material = useMemo(() => {
    const nextMaterial = new THREE_WEBGPU.MeshBasicNodeMaterial({
      side,
      toneMapped: false,
    });

    nextMaterial.colorNode = buildFeedbackColorNode(
      uniforms,
      sceneRT.texture,
      feedbackTextureNode
    )();
    return nextMaterial;
  }, [feedbackTextureNode, sceneRT.texture, side, uniforms]);

  useEffect(
    () => () => {
      material.dispose();
    },
    [material]
  );

  useFrame(({ clock }) => {
    uniforms.time.value = clock.getElapsedTime();

    const previousTarget = gl.getRenderTarget?.() || null;
    const hiddenMeshes = [];

    scene.traverse((object) => {
      const meshObject = object;

      if (!meshObject?.isMesh || meshObject.visible === false) {
        return;
      }

      const meshMaterial = meshObject.material;
      const hasMaterial = Array.isArray(meshMaterial)
        ? meshMaterial.includes(material)
        : meshMaterial === material;

      if (!hasMaterial) {
        return;
      }

      hiddenMeshes.push(meshObject);
      meshObject.visible = false;
    });

    try {
      gl.setRenderTarget(sceneRT);
      gl.clear();
      gl.render(scene, camera);

      for (let i = 0; i < hiddenMeshes.length; i += 1) {
        hiddenMeshes[i].visible = true;
      }

      const readTarget = swap.current ? feedbackA : feedbackB;
      const writeTarget = swap.current ? feedbackB : feedbackA;
      feedbackTextureNode.value = initialized.current
        ? readTarget.texture
        : sceneRT.texture;

      gl.setRenderTarget(writeTarget);
      gl.clear();
      gl.render(scene, camera);
      initialized.current = true;

      // Match WebGL behavior: display the freshly written accumulation result.
      feedbackTextureNode.value = writeTarget.texture;
    } finally {
      for (let i = 0; i < hiddenMeshes.length; i += 1) {
        hiddenMeshes[i].visible = true;
      }
      swap.current = !swap.current;
      gl.setRenderTarget(previousTarget);
    }
  });

  return <primitive object={material} attach="material" />;
}
