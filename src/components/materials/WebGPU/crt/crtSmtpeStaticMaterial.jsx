import React, { useEffect, useMemo, useRef } from 'react';

import { extend, useFrame } from '@react-three/fiber';

import { FrontSide } from 'three';
import * as THREE from 'three';
import {
  Fn,
  float,
  mix,
  step,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE_WEBGPU from 'three/webgpu';

import {
  curveUvNode,
  hash21Node,
  maskPatternNode,
  scanlineFactorNode,
  staticNoiseNode,
  vignetteFactorNode,
} from './crtSharedNodes';

extend(THREE_WEBGPU);

function buildSmpteColorNode(uniforms, barsTexture) {
  return Fn(() => {
    const inputUv = curveUvNode(uv(), uniforms.curvature);
    const edgeMask = step(0.0, inputUv.x)
      .mul(step(inputUv.x, 1.0))
      .mul(step(0.0, inputUv.y))
      .mul(step(inputUv.y, 1.0));

    const staticField = staticNoiseNode(
      inputUv,
      uniforms.time,
      uniforms.staticScale,
      uniforms.staticSpeed
    );
    const drift = uniforms.time
      .mul(0.6)
      .sin()
      .mul(0.002)
      .mul(uniforms.convergenceDrift);
    const rBars = texture(barsTexture, inputUv.add(vec2(drift, 0.0))).rgb;
    const gBars = texture(barsTexture, inputUv).rgb;
    const bBars = texture(barsTexture, inputUv.sub(vec2(drift, 0.0))).rgb;
    const bars = vec3(rBars.r, gBars.g, bBars.b).mul(
      maskPatternNode(inputUv, uniforms.maskMode, uniforms.maskStrength)
    );
    const scanline = scanlineFactorNode(
      inputUv,
      900.0,
      uniforms.scanlineStrength
    );
    const glitch = step(
      float(1.0).sub(uniforms.glitchRate),
      hash21Node(vec2(uniforms.time.mul(10.0).floor(), 0.0))
    );

    const color = bars
      .sub(scanline)
      .add(
        vec3(hash21Node(inputUv.mul(60.0).add(uniforms.time.mul(0.4)))).mul(
          0.02
        )
      );

    return mix(
      color.mul(vignetteFactorNode(inputUv, uniforms.vignette)),
      vec3(staticField),
      glitch.mul(uniforms.staticAmount)
    ).mul(edgeMask);
  });
}

function createSmpteBarsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const drawBand = (yStart, yEnd, colors) => {
    const w = canvas.width;
    const h = canvas.height;
    colors.forEach((color, index) => {
      const x0 = Math.floor((index / colors.length) * w);
      const x1 = Math.floor(((index + 1) / colors.length) * w);
      ctx.fillStyle = color;
      ctx.fillRect(
        x0,
        Math.floor(yStart * h),
        x1 - x0,
        Math.floor((yEnd - yStart) * h)
      );
    });
  };

  drawBand(0.0, 0.62, [
    '#ffffff',
    '#ffff00',
    '#00ffff',
    '#00ff00',
    '#ff00ff',
    '#ff0000',
    '#0000ff',
  ]);

  drawBand(0.62, 0.7, [
    '#0000ff',
    '#000000',
    '#ff00ff',
    '#000000',
    '#00ffff',
    '#000000',
    '#666666',
  ]);

  drawBand(0.7, 1.0, [
    '#000066',
    '#ffffff',
    '#1a1a1a',
    '#000000',
    '#666666',
    '#000000',
  ]);

  const barsTexture = new THREE.CanvasTexture(canvas);
  barsTexture.minFilter = THREE.LinearFilter;
  barsTexture.magFilter = THREE.LinearFilter;
  barsTexture.wrapS = THREE.ClampToEdgeWrapping;
  barsTexture.wrapT = THREE.ClampToEdgeWrapping;
  barsTexture.colorSpace = THREE.SRGBColorSpace;
  return barsTexture;
}

export default function CRTSmtpeStaticMaterial({
  staticAmount = 0.35,
  staticScale = 700,
  staticSpeed = 9,
  snap = 24,
  glitchRate = 0.18,
  scanlineStrength = 0.55,
  colorBleed = 0.14,
  curvature = 0.12,
  vignette = 0.75,
  maskStrength = 0.35,
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
  maskMode = 0,
  side = FrontSide,
}) {
  const barsTextureRef = useRef(null);
  if (!barsTextureRef.current) {
    barsTextureRef.current = createSmpteBarsTexture();
  }

  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      staticAmount: uniform(staticAmount),
      staticScale: uniform(staticScale),
      staticSpeed: uniform(staticSpeed),
      snap: uniform(snap),
      glitchRate: uniform(glitchRate),
      scanlineStrength: uniform(scanlineStrength),
      colorBleed: uniform(colorBleed),
      curvature: uniform(curvature),
      vignette: uniform(vignette),
      maskStrength: uniform(maskStrength),
      flybackStrength: uniform(flybackStrength),
      convergenceDrift: uniform(convergenceDrift),
      bloomStrength: uniform(bloomStrength),
      breathStrength: uniform(breathStrength),
      retraceStrength: uniform(retraceStrength),
      beamWidth: uniform(beamWidth),
      chromaDrift: uniform(chromaDrift),
      humStrength: uniform(humStrength),
      thermalDrift: uniform(thermalDrift),
      spotNoise: uniform(spotNoise),
      maskMode: uniform(maskMode),
      barrelConvergence: uniform(barrelConvergence),
    }),
    []
  );

  useEffect(() => {
    uniforms.staticAmount.value = staticAmount;
    uniforms.staticScale.value = staticScale;
    uniforms.staticSpeed.value = staticSpeed;
    uniforms.snap.value = snap;
    uniforms.glitchRate.value = glitchRate;
    uniforms.scanlineStrength.value = scanlineStrength;
    uniforms.colorBleed.value = colorBleed;
    uniforms.curvature.value = curvature;
    uniforms.vignette.value = vignette;
    uniforms.maskStrength.value = maskStrength;
    uniforms.flybackStrength.value = flybackStrength;
    uniforms.convergenceDrift.value = convergenceDrift;
    uniforms.bloomStrength.value = bloomStrength;
    uniforms.breathStrength.value = breathStrength;
    uniforms.retraceStrength.value = retraceStrength;
    uniforms.beamWidth.value = beamWidth;
    uniforms.chromaDrift.value = chromaDrift;
    uniforms.humStrength.value = humStrength;
    uniforms.thermalDrift.value = thermalDrift;
    uniforms.spotNoise.value = spotNoise;
    uniforms.maskMode.value = maskMode;
    uniforms.barrelConvergence.value = barrelConvergence;
  }, [
    barrelConvergence,
    beamWidth,
    bloomStrength,
    breathStrength,
    chromaDrift,
    colorBleed,
    convergenceDrift,
    curvature,
    flybackStrength,
    glitchRate,
    humStrength,
    maskMode,
    maskStrength,
    retraceStrength,
    scanlineStrength,
    snap,
    spotNoise,
    staticAmount,
    staticScale,
    staticSpeed,
    thermalDrift,
    uniforms,
    vignette,
  ]);

  const material = useMemo(() => {
    const nextMaterial = new THREE_WEBGPU.MeshBasicNodeMaterial({
      side,
      toneMapped: false,
    });

    nextMaterial.colorNode = buildSmpteColorNode(
      uniforms,
      barsTextureRef.current
    )();
    return nextMaterial;
  }, [side, uniforms]);

  useEffect(
    () => () => {
      barsTextureRef.current?.dispose?.();
    },
    []
  );

  useFrame(({ clock }) => {
    uniforms.time.value = clock.getElapsedTime();
  });

  return <primitive object={material} attach="material" />;
}
