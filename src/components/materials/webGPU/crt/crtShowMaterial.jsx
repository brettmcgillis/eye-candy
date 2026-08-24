import React, { useEffect, useMemo, useRef, useState } from 'react';

import { extend, useFrame } from '@react-three/fiber';

import * as THREE from 'three';
import { Fn, texture as tslTexture, uniform, uv, vec3 } from 'three/tsl';
import * as THREE_WEBGPU from 'three/webgpu';

import { videoFile } from '@utils/appUtils';

import {
  curveUvNode,
  hash21Node,
  maskPatternNode,
  staticNoiseNode,
  vignetteFactorNode,
} from './crtSharedNodes';

extend(THREE_WEBGPU);

function buildShowColorNode(uniforms, sourceTexture) {
  return Fn(() => {
    const inputUv = curveUvNode(uv(), uniforms.curvature);
    const edgeMask = inputUv.x
      .step(0.0)
      .mul(inputUv.x.oneMinus().step(0.0))
      .mul(inputUv.y.step(0.0))
      .mul(inputUv.y.oneMinus().step(0.0));

    const sample = tslTexture(sourceTexture, inputUv);
    const noise = staticNoiseNode(
      inputUv,
      uniforms.time,
      uniforms.staticScale,
      uniforms.staticSpeed
    );
    const color = sample.rgb
      .mul(maskPatternNode(inputUv, uniforms.maskMode, uniforms.maskStrength))
      .add(vec3(noise).mul(uniforms.staticAmount.mul(0.45)))
      .sub(
        vec3(hash21Node(inputUv.mul(600.0).add(uniforms.time.mul(60.0)))).mul(
          uniforms.colorBleed.mul(0.15)
        )
      )
      .mul(vignetteFactorNode(inputUv, uniforms.vignette));

    return color.mul(edgeMask);
  });
}

export default function CRTShowMaterial({
  src = videoFile('ren_and_stimpy.mp4'),
  useWebcam = false,
  staticAmount = 0.35,
  staticScale = 700,
  staticSpeed = 9,
  scanlineStrength = 0.55,
  colorBleed = 0.14,
  curvature = 0.12,
  vignette = 0.75,
  maskStrength = 0.35,
  maskMode = 0,
  side = THREE.FrontSide,
  ...legacyProps
}) {
  const {
    padX = 0.06,
    padY = 0.08,
    snap = 24,
    glitchRate = 0.18,
    flybackStrength = 0.35,
    convergenceDrift = 0.4,
    bloomStrength = 0.25,
    breathStrength = 0.35,
    retraceStrength = 0.35,
    beamWidth = 0.5,
    chromaDrift = 0.3,
    humStrength = 0.25,
    barrelConvergence = 0.6,
    spotNoise = 0.35,
    thermalDrift = 0.15,
  } = legacyProps;

  const videoRef = useRef(null);
  const [sourceTexture, setSourceTexture] = useState(() => new THREE.Texture());

  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      staticAmount: uniform(staticAmount),
      staticScale: uniform(staticScale),
      staticSpeed: uniform(staticSpeed),
      scanlineStrength: uniform(scanlineStrength),
      colorBleed: uniform(colorBleed),
      curvature: uniform(curvature),
      vignette: uniform(vignette),
      maskStrength: uniform(maskStrength),
      maskMode: uniform(maskMode),
    }),
    []
  );

  useEffect(() => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    videoRef.current = video;

    let stream = null;
    let disposed = false;

    async function startVideo() {
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      setSourceTexture(texture);

      if (useWebcam) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
          if (disposed) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          video.srcObject = stream;
        } catch (error) {
          if (error) {
            // Fall back to the local video source when webcam access fails.
          }
        }
      }

      video.src = src;
      await video.play();
    }

    startVideo();

    return () => {
      disposed = true;
      setSourceTexture((prev) => {
        prev?.dispose?.();
        return new THREE.Texture();
      });
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      video.pause();
      video.remove();
      videoRef.current = null;
    };
  }, [src, useWebcam]);

  useEffect(() => {
    uniforms.staticAmount.value = staticAmount;
    uniforms.staticScale.value = staticScale;
    uniforms.staticSpeed.value = staticSpeed;
    uniforms.scanlineStrength.value = scanlineStrength;
    uniforms.colorBleed.value = colorBleed;
    uniforms.curvature.value = curvature;
    uniforms.vignette.value = vignette;
    uniforms.maskStrength.value = maskStrength;
    uniforms.maskMode.value = maskMode;
  }, [
    colorBleed,
    curvature,
    maskMode,
    maskStrength,
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

    nextMaterial.colorNode = buildShowColorNode(uniforms, sourceTexture)();
    return nextMaterial;
  }, [side, sourceTexture, uniforms]);

  useEffect(() => {
    material.userData.legacyProps = {
      padX,
      padY,
      snap,
      glitchRate,
      flybackStrength,
      convergenceDrift,
      bloomStrength,
      breathStrength,
      retraceStrength,
      beamWidth,
      chromaDrift,
      humStrength,
      barrelConvergence,
      spotNoise,
      thermalDrift,
    };
  }, [
    barrelConvergence,
    beamWidth,
    bloomStrength,
    breathStrength,
    chromaDrift,
    convergenceDrift,
    flybackStrength,
    glitchRate,
    humStrength,
    material,
    padX,
    padY,
    retraceStrength,
    snap,
    spotNoise,
    thermalDrift,
  ]);

  useFrame(({ clock }) => {
    uniforms.time.value = clock.getElapsedTime();
  });

  return <primitive object={material} attach="material" />;
}
