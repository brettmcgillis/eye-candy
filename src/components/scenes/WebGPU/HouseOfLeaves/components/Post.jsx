import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import {
  dot,
  float,
  floor,
  fract,
  int,
  max,
  pass,
  rtt,
  screenCoordinate,
  screenUV,
  sin,
  smoothstep,
  time,
  color as tslColor,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import buildFogVolume from '../utils/fogNodes';

const DEG = Math.PI / 180;

// The frame, finished: the scene composited with the raymarched volume,
// then bloom, vignette and grain, then AgX tone mapping. Mounting this takes
// over rendering, because the pass has to run after the walker has placed
// the camera and after the streamed geometry has been positioned against it.
function Post({ config, flares, flashlight }) {
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const pipelineRef = useRef(null);
  const volumeRef = useRef(null);

  const { beam, cookie } = flashlight;

  const uniforms = useMemo(
    () => ({
      beamColor: uniform(tslColor('#cdd3dd')),
      beamCosInner: uniform(0.9),
      beamCosOuter: uniform(0.8),
      beamFalloff: uniform(0.004),
      beamMatrix: uniform(new THREE.Matrix4()),
      beamRange: uniform(60),
      beamScatter: uniform(1),
      beamSpread: uniform(0.4),
      airGlow: uniform(tslColor('#000000')),
      bloomStrength: uniform(0.35),
      bloomThreshold: uniform(0.5),
      fogDensity: uniform(0.05),
      fogMaxDistance: uniform(160),
      fogNoiseAmount: uniform(0.5),
      fogNoiseScale: uniform(0.05),
      flareScatter: uniform(1),
      fogSteps: uniform(int(24)),
      grainAmount: uniform(0.05),
      vignetteAmount: uniform(0.4),
      vignetteSoftness: uniform(0.5),
    }),
    []
  );

  useEffect(() => {
    if (!renderer) return undefined;
    const previous = {
      toneMapping: renderer.toneMapping,
      exposure: renderer.toneMappingExposure,
    };
    renderer.toneMapping = THREE.AgXToneMapping;
    return () => {
      renderer.toneMapping = previous.toneMapping;
      renderer.toneMappingExposure = previous.exposure;
    };
  }, [renderer]);

  useEffect(() => {
    if (renderer) renderer.toneMappingExposure = config.exposure;
  }, [config.exposure, renderer]);

  useEffect(() => {
    if (!renderer || !scene || !camera || !cookie) return undefined;

    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode('output');

    let composite = sceneColor.rgb;
    if (config.fogEnabled) {
      const volume = rtt(
        buildFogVolume({
          cookie,
          flareTexture: flares.texture,
          sceneDepth: scenePass.getTextureNode('depth'),
          uniforms,
        })
      );
      volume.setResolutionScale(config.fogResolutionScale);
      volumeRef.current = volume;
      composite = sceneColor.rgb.mul(volume.a).add(volume.rgb);
    }

    let output = composite;
    if (config.bloomEnabled) {
      const bright = max(composite.sub(uniforms.bloomThreshold), 0);
      const bloom = gaussianBlur(bright, config.bloomRadius, 6, {
        resolutionScale: 0.4,
      });
      output = output.add(bloom.mul(uniforms.bloomStrength));
    }
    if (config.vignetteEnabled) {
      const centred = screenUV.sub(0.5).mul(vec2(1.15, 1)).length().mul(1.6);
      const fall = smoothstep(
        float(1).sub(uniforms.vignetteSoftness),
        float(1.15),
        centred
      );
      output = output.mul(float(1).sub(fall.mul(uniforms.vignetteAmount)));
    }
    if (config.grainEnabled) {
      // Per-pixel, animated, applied last so it lands on the finished image:
      // it is what stops the near-blacks banding.
      const cell = floor(screenCoordinate.xy);
      const drift = floor(time.mul(24));
      const noise = fract(
        sin(dot(cell.add(drift), vec2(12.9898, 78.233))).mul(43758.5453)
      );
      output = output.add(vec3(noise.sub(0.5).mul(uniforms.grainAmount)));
    }

    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputNode = output;
    pipelineRef.current = pipeline;

    return () => {
      pipelineRef.current = null;
      volumeRef.current = null;
    };
  }, [
    camera,
    config.bloomEnabled,
    config.bloomRadius,
    config.fogEnabled,
    config.grainEnabled,
    config.vignetteEnabled,
    cookie,
    flares,
    renderer,
    scene,
    uniforms,
  ]);

  useEffect(() => {
    const outer = config.beamAngle * DEG;
    uniforms.beamColor.value.set(config.beamColor);
    uniforms.beamCosOuter.value = Math.cos(outer);
    uniforms.beamCosInner.value = Math.cos(
      outer * (1 - Math.max(0.03, config.beamPenumbra * 0.9))
    );
    uniforms.beamFalloff.value = config.beamFalloff;
    uniforms.beamRange.value = config.beamRange;
    uniforms.beamScatter.value = config.beamScatter;
    uniforms.beamSpread.value = Math.tan(outer);
    uniforms.airGlow.value
      .set(config.airGlowColor)
      .multiplyScalar(config.airGlow);
    uniforms.bloomStrength.value = config.bloomStrength;
    uniforms.bloomThreshold.value = config.bloomThreshold;
    uniforms.fogDensity.value = config.fogDensity;
    uniforms.fogMaxDistance.value = config.fogMaxDistance;
    uniforms.fogNoiseAmount.value = config.fogNoiseAmount;
    uniforms.fogNoiseScale.value = config.fogNoiseScale;
    uniforms.fogSteps.value = config.fogSteps;
    uniforms.flareScatter.value = config.flareScatter;
    uniforms.grainAmount.value = config.grainAmount;
    uniforms.vignetteAmount.value = config.vignetteAmount;
    uniforms.vignetteSoftness.value = config.vignetteSoftness;
    volumeRef.current?.setResolutionScale(config.fogResolutionScale);
  }, [config, uniforms]);

  // Priority 1, so this runs after the walker has placed the camera (-1) and
  // after Flashlight has written the beam frame for this frame (0).
  useFrame(() => {
    if (beam.ready) uniforms.beamMatrix.value.copy(beam.matrix);
    flares.pack();
    pipelineRef.current?.render();
  }, 1);

  return null;
}

export default memo(Post);
