import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { int, max, pass, rtt, color as tslColor, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import buildFogVolume from '../utils/fogNodes';

const DEG = Math.PI / 180;

// Mounting this switches R3F to manual rendering, because the pass has to run
// after the walker has placed the camera and after the streamed geometry has
// been positioned against it. Unmounting hands rendering back, which is what
// makes the fog safe to switch off.
function VolumetricFog({ config, flares, flashlight }) {
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
      bloomStrength: uniform(0.35),
      bloomThreshold: uniform(0.5),
      fogDensity: uniform(0.05),
      fogMaxDistance: uniform(160),
      fogNoiseAmount: uniform(0.5),
      fogNoiseScale: uniform(0.05),
      flareColor: uniform(tslColor('#ff3a1e')),
      flareScatter: uniform(1),
      fogSteps: uniform(int(24)),
    }),
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera || !cookie) return undefined;

    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode('output');

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

    const composite = sceneColor.rgb.mul(volume.a).add(volume.rgb);
    const pipeline = new THREE.RenderPipeline(renderer);
    if (config.bloomEnabled) {
      const bright = max(composite.sub(uniforms.bloomThreshold), 0);
      const bloom = gaussianBlur(bright, 0.6, 6, { resolutionScale: 0.4 });
      pipeline.outputNode = composite.add(bloom.mul(uniforms.bloomStrength));
    } else {
      pipeline.outputNode = composite;
    }
    pipelineRef.current = pipeline;

    return () => {
      pipelineRef.current = null;
      volumeRef.current = null;
    };
  }, [camera, config.bloomEnabled, cookie, flares, renderer, scene, uniforms]);

  useEffect(() => {
    const outer = config.beamAngle * DEG;
    uniforms.beamColor.value.set(config.beamColor);
    uniforms.beamCosOuter.value = Math.cos(outer);
    // Never let the two cone edges meet: an equal-edge smoothstep is
    // undefined, and a zero-penumbra beam is a legitimate control setting.
    uniforms.beamCosInner.value = Math.cos(
      outer * (1 - Math.max(0.03, config.beamPenumbra * 0.9))
    );
    uniforms.beamFalloff.value = config.beamFalloff;
    uniforms.beamRange.value = config.beamRange;
    uniforms.beamScatter.value = config.beamScatter;
    uniforms.beamSpread.value = Math.tan(outer);
    uniforms.bloomStrength.value = config.bloomStrength;
    uniforms.bloomThreshold.value = config.bloomThreshold;
    uniforms.fogDensity.value = config.fogDensity;
    uniforms.fogMaxDistance.value = config.fogMaxDistance;
    uniforms.fogNoiseAmount.value = config.fogNoiseAmount;
    uniforms.fogNoiseScale.value = config.fogNoiseScale;
    uniforms.fogSteps.value = config.fogSteps;
    uniforms.flareColor.value.set(config.flareColor);
    uniforms.flareScatter.value = config.flareScatter;
    volumeRef.current?.setResolutionScale(config.fogResolutionScale);
  }, [config, uniforms]);

  // Priority 1, so this runs after the walker has placed the camera (-1) and
  // after Flashlight has written the beam frame for this frame (0).
  useFrame(() => {
    if (beam.ready) uniforms.beamMatrix.value.copy(beam.matrix);
    // Packed here rather than by the flares themselves: they run at priority 0
    // and this is the first point at which all of them have written their
    // world position for this frame.
    flares.pack();
    pipelineRef.current?.render();
  }, 1);

  return null;
}

export default memo(VolumetricFog);
