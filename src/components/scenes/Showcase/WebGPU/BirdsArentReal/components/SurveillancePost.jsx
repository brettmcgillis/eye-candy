import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { max, pass, uniform, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  applyRetroColorDepth,
  applyRetroScanlines,
  applyRetroVignette,
} from '../../../../../materials/webGPU/crt/retroEffectNodes';
import applySecurityCamOverlay from '../../../../../materials/webGPU/crt/securityCamOverlayNode';
import {
  createSecurityCamTimestampTexture,
  drawSecurityCamTimestamp,
  resolveSurveillanceFrameBounds,
} from '../../../../../materials/webGPU/crt/surveillanceHUD';

const AISLE_LABEL = 'DEPT. OF BIRDS';

// Retro CRT character of the surveillance feed. Held as constants (the scene only
// exposes the high-level knobs below); tweak here to re-flavor the whole feed.
const COLOR_DEPTH_STEPS = 64;
const SCANLINE_DENSITY = 1;
const SCANLINE_SPEED = 0;
const CHROMATIC_SCALE = 1.2;
const BLOOM_DOWNSAMPLE = 2;

/**
 * Single post chain for Birds Arent Real: scene-pass bloom (same recipe as Bloom.jsx)
 * plus, when `overlayEnabled`, the Aisle9 CCTV stack — retro scanlines/vignette/chroma
 * and the security-cam HUD overlay (REC dot, timestamp, CAM #### corner frame). Only
 * ONE THREE.RenderPipeline may call render() per frame, so this REPLACES <Bloom> when
 * the scene wants the surveillance look. `cameraLabel` is the active bird's id.
 */
function SurveillancePost({
  bloomEnabled = true,
  bloomThreshold = 0.9,
  bloomStrength = 0.35,
  bloomRadius = 0.5,
  overlayEnabled = false,
  hudOpacity = 0.56,
  scanlineIntensity = 0.3,
  vignetteIntensity = 0.3,
  chromaticStrength = 0.0015,
  cameraLabel = 'BIRD 0.0.0.0',
}) {
  const { gl: renderer, scene, camera, size } = useThree();
  const postRef = useRef(null);
  const timestampTextureState = useMemo(createSecurityCamTimestampTexture, []);

  const u = useMemo(
    () => ({
      bloomThreshold: uniform(bloomThreshold),
      bloomStrength: uniform(bloomStrength),
      surveillanceOverlayEnabled: uniform(overlayEnabled ? 1 : 0),
      surveillanceHudOpacity: uniform(hudOpacity),
      surveillanceEffectBoost: uniform(1),
      surveillanceFrameMin: uniform(new THREE.Vector2(0, 0)),
      surveillanceFrameMax: uniform(new THREE.Vector2(1, 1)),
      retroColorDepthSteps: uniform(COLOR_DEPTH_STEPS),
      retroScanlineIntensity: uniform(scanlineIntensity),
      retroScanlineDensity: uniform(SCANLINE_DENSITY),
      retroScanlineSpeed: uniform(SCANLINE_SPEED),
      retroVignetteIntensity: uniform(vignetteIntensity),
      chromaticStrength: uniform(chromaticStrength),
    }),
    // built once; live values are pushed in useFrame
    []
  );

  useEffect(() => {
    u.surveillanceOverlayEnabled.value = overlayEnabled ? 1 : 0;
  }, [overlayEnabled, u]);

  useEffect(
    () => () => timestampTextureState.texture.dispose(),
    [timestampTextureState]
  );

  // (Re)build the node graph when the structural toggles change.
  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    let outputNode = scenePass;

    if (bloomEnabled) {
      const bright = max(scenePass.sub(u.bloomThreshold), 0.0);
      const blurred = gaussianBlur(bright, bloomRadius, 6, {
        resolutionScale: 1 / BLOOM_DOWNSAMPLE,
      });
      outputNode = scenePass.add(blurred.mul(u.bloomStrength));
    }

    if (overlayEnabled) {
      outputNode = chromaticAberration(
        outputNode,
        u.chromaticStrength,
        vec2(0.5, 0.5),
        CHROMATIC_SCALE
      );
      outputNode = applyRetroScanlines(
        outputNode,
        u.retroScanlineIntensity,
        u.retroScanlineDensity.mul(0.95).add(0.05),
        u.retroScanlineSpeed
      );
      outputNode = applyRetroVignette(outputNode, u.retroVignetteIntensity);
      outputNode = applyRetroColorDepth(outputNode, u.retroColorDepthSteps);
      outputNode = applySecurityCamOverlay(
        outputNode,
        u,
        timestampTextureState.texture
      );
    }

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = outputNode;
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
    };
  }, [
    renderer,
    scene,
    camera,
    bloomEnabled,
    bloomRadius,
    overlayEnabled,
    timestampTextureState,
    u,
  ]);

  const cachedBoundsRef = useRef(null);
  const cachedSizeRef = useRef(null);

  useFrame(() => {
    u.bloomThreshold.value = bloomThreshold;
    u.bloomStrength.value = bloomStrength;
    u.surveillanceHudOpacity.value = hudOpacity;
    u.retroScanlineIntensity.value = scanlineIntensity;
    u.retroVignetteIntensity.value = vignetteIntensity;
    u.chromaticStrength.value = chromaticStrength;

    if (overlayEnabled) {
      if (
        !cachedBoundsRef.current ||
        cachedSizeRef.current?.width !== size.width ||
        cachedSizeRef.current?.height !== size.height
      ) {
        cachedBoundsRef.current = resolveSurveillanceFrameBounds(size);
        cachedSizeRef.current = { width: size.width, height: size.height };
      }
      const { effectBoost, frameAspect, isMobile, maxX, maxY, minX, minY } =
        cachedBoundsRef.current;
      u.surveillanceEffectBoost.value = effectBoost;
      u.surveillanceFrameMin.value.set(minX, minY);
      u.surveillanceFrameMax.value.set(maxX, maxY);

      drawSecurityCamTimestamp(
        timestampTextureState,
        cameraLabel,
        frameAspect,
        AISLE_LABEL,
        new Date(),
        isMobile
      );
    }

    if (!postRef.current) return;
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(SurveillancePost);
