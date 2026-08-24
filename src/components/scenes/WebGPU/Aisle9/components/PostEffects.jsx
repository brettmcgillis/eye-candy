import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js';
import { pass, uniform, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  applyRetroAffineDistortion,
  applyRetroColorDepth,
  applyRetroScanlines,
  applyRetroVignette,
} from '@materials/webGPU/crt/retroEffectNodes';
import applySecurityCamOverlay from '@materials/webGPU/crt/securityCamOverlayNode';
import {
  DEFAULT_AISLE_LABEL,
  createSecurityCamTimestampTexture,
  drawSecurityCamTimestamp,
  resolveSurveillanceFrameBounds,
} from '@materials/webGPU/crt/surveillanceHUD';

export const SINGULARITY_BLOOM_LAYER = 11;

const SOURCE_BLOOM_STRENGTH = 0.217;
const SOURCE_BLOOM_RADIUS = 0;
const SOURCE_BLOOM_THRESHOLD = 0;
const SOURCE_HUD_OPACITY = 0.56;
const SOURCE_RETRO_CURVATURE = 0.02;
const SOURCE_RETRO_COLOR_DEPTH_STEPS = 64;
const SOURCE_RETRO_SCANLINE_INTENSITY = 0.3;
const SOURCE_RETRO_SCANLINE_DENSITY = 1;
const SOURCE_RETRO_SCANLINE_SPEED = 0;
const SOURCE_RETRO_VIGNETTE_INTENSITY = 0.3;
const SOURCE_RETRO_COLOR_BLEEDING = 0.001;
const SOURCE_RETRO_AFFINE_DISTORTION = 0;
const SOURCE_CHROMATIC_ABERRATION_STRENGTH = 1.2;
const SOURCE_CHROMATIC_ABERRATION_SCALE = 1.25;
const SOURCE_CHROMATIC_ABERRATION_CENTER_X = 0.5;
const SOURCE_CHROMATIC_ABERRATION_CENTER_Y = 0.5;

const PostEffects = memo(function PostEffects({
  bloomEnabled,
  bloomRadius,
  bloomStrength,
  bloomThreshold,
  bloomToneMappingExposure,
  cameraLabel,
  chromaticAberrationCenterX,
  chromaticAberrationCenterY,
  chromaticAberrationEnabled,
  chromaticAberrationScale,
  chromaticAberrationStrength,
  overlayEnabled,
  retroAffineDistortion,
  retroColorBleeding,
  retroColorDepthSteps,
  retroCurvature,
  retroEnabled,
  retroScanlineDensity,
  retroScanlineIntensity,
  retroScanlineSpeed,
  retroVignetteIntensity,
  recordingStartMs,
}) {
  const { gl: renderer, scene, camera, size } = useThree();
  const postRef = useRef(null);
  const seededTimelineRef = useRef({ seedMs: null, anchorMs: 0 });
  const timestampTextureState = useMemo(createSecurityCamTimestampTexture, []);
  const bloomUniforms = useMemo(
    () => ({
      bloomStrength: uniform(SOURCE_BLOOM_STRENGTH),
      bloomRadius: uniform(SOURCE_BLOOM_RADIUS),
      bloomThreshold: uniform(SOURCE_BLOOM_THRESHOLD),
    }),
    []
  );
  const uniforms = useMemo(
    () => ({
      surveillanceOverlayEnabled: uniform(overlayEnabled ? 1 : 0),
      surveillanceHudOpacity: uniform(SOURCE_HUD_OPACITY),
      surveillanceEffectBoost: uniform(1),
      surveillanceFrameMin: uniform(new THREE.Vector2(0, 0)),
      surveillanceFrameMax: uniform(new THREE.Vector2(1, 1)),
      retroCurvature: uniform(SOURCE_RETRO_CURVATURE),
      retroColorDepthSteps: uniform(SOURCE_RETRO_COLOR_DEPTH_STEPS),
      retroScanlineIntensity: uniform(SOURCE_RETRO_SCANLINE_INTENSITY),
      retroScanlineDensity: uniform(SOURCE_RETRO_SCANLINE_DENSITY),
      retroScanlineSpeed: uniform(SOURCE_RETRO_SCANLINE_SPEED),
      retroVignetteIntensity: uniform(SOURCE_RETRO_VIGNETTE_INTENSITY),
      retroColorBleeding: uniform(SOURCE_RETRO_COLOR_BLEEDING),
      retroAffineDistortion: uniform(SOURCE_RETRO_AFFINE_DISTORTION),
      chromaticAberrationStrength: uniform(
        SOURCE_CHROMATIC_ABERRATION_STRENGTH
      ),
      chromaticAberrationScale: uniform(SOURCE_CHROMATIC_ABERRATION_SCALE),
      chromaticAberrationCenter: uniform(
        new THREE.Vector2(
          SOURCE_CHROMATIC_ABERRATION_CENTER_X,
          SOURCE_CHROMATIC_ABERRATION_CENTER_Y
        )
      ),
    }),
    []
  );

  useEffect(() => {
    uniforms.surveillanceOverlayEnabled.value = overlayEnabled ? 1 : 0;
  }, [overlayEnabled, uniforms]);

  useEffect(() => {
    if (Number.isFinite(recordingStartMs)) {
      seededTimelineRef.current = {
        seedMs: recordingStartMs,
        anchorMs: Date.now(),
      };
      return;
    }
    seededTimelineRef.current = { seedMs: null, anchorMs: 0 };
  }, [recordingStartMs]);

  useEffect(
    () => () => {
      timestampTextureState.texture.dispose();
    },
    [timestampTextureState]
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const previousToneMapping = renderer.toneMapping;
    const previousToneMappingExposure = renderer.toneMappingExposure;
    const previousOutputColorSpace = renderer.outputColorSpace;

    if (bloomEnabled) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = bloomToneMappingExposure;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    const scenePass = pass(scene, camera);
    const postProcessing = new THREE.RenderPipeline(renderer);
    let outputNode = scenePass;

    if (bloomEnabled) {
      const bloomLayers = new THREE.Layers();
      bloomLayers.disableAll();
      bloomLayers.enable(SINGULARITY_BLOOM_LAYER);

      const bloomPass = pass(scene, camera, { depthBuffer: false });
      bloomPass.setLayers(bloomLayers);

      outputNode = scenePass.add(
        bloom(
          bloomPass.getTextureNode(),
          bloomUniforms.bloomStrength,
          bloomUniforms.bloomRadius,
          bloomUniforms.bloomThreshold
        )
      );
    }

    if (retroEnabled) {
      let retroNode = outputNode;
      const distortionStrength = uniforms.retroColorBleeding
        .add(uniforms.retroCurvature.mul(0.08))
        .add(uniforms.retroAffineDistortion.mul(0.05));
      const distortionScale = uniforms.retroCurvature
        .mul(0.5)
        .add(uniforms.retroAffineDistortion.mul(0.35))
        .add(1);
      const scanlineDensity = uniforms.retroScanlineDensity.mul(0.95).add(0.05);

      retroNode = chromaticAberration(
        retroNode,
        distortionStrength,
        vec2(0.5, 0.5),
        distortionScale
      );
      retroNode = applyRetroAffineDistortion(
        retroNode,
        uniforms.retroAffineDistortion
      );
      retroNode = applyRetroScanlines(
        retroNode,
        uniforms.retroScanlineIntensity,
        scanlineDensity,
        uniforms.retroScanlineSpeed
      );
      retroNode = applyRetroVignette(
        retroNode,
        uniforms.retroVignetteIntensity
      );
      retroNode = applyRetroColorDepth(
        retroNode,
        uniforms.retroColorDepthSteps
      );

      outputNode = retroNode;
    }

    if (chromaticAberrationEnabled) {
      const standaloneChromaticStrength =
        uniforms.chromaticAberrationStrength.mul(2.4);
      const standaloneChromaticScale = uniforms.chromaticAberrationScale.add(
        uniforms.chromaticAberrationStrength.mul(0.08)
      );
      outputNode = chromaticAberration(
        outputNode,
        standaloneChromaticStrength,
        uniforms.chromaticAberrationCenter,
        standaloneChromaticScale
      );
    }

    postProcessing.outputNode = overlayEnabled
      ? applySecurityCamOverlay(
          outputNode,
          uniforms,
          timestampTextureState.texture
        )
      : outputNode;
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
      renderer.toneMapping = previousToneMapping;
      renderer.toneMappingExposure = previousToneMappingExposure;
      renderer.outputColorSpace = previousOutputColorSpace;
    };
  }, [
    bloomEnabled,
    bloomUniforms,
    bloomToneMappingExposure,
    camera,
    chromaticAberrationEnabled,
    overlayEnabled,
    retroEnabled,
    renderer,
    scene,
    timestampTextureState,
    uniforms,
  ]);

  const cachedFrameBoundsRef = useRef(null);
  const cachedSizeRef = useRef(null);

  useFrame(() => {
    if (overlayEnabled) {
      if (
        !cachedFrameBoundsRef.current ||
        cachedSizeRef.current?.width !== size.width ||
        cachedSizeRef.current?.height !== size.height
      ) {
        cachedFrameBoundsRef.current = resolveSurveillanceFrameBounds(size);
        cachedSizeRef.current = { width: size.width, height: size.height };
      }

      const { effectBoost, frameAspect, isMobile, maxX, maxY, minX, minY } =
        cachedFrameBoundsRef.current;
      uniforms.surveillanceEffectBoost.value = effectBoost;
      uniforms.surveillanceFrameMin.value.set(minX, minY);
      uniforms.surveillanceFrameMax.value.set(maxX, maxY);

      const seededTimeline = seededTimelineRef.current;
      const hasSeededTimeline = Number.isFinite(seededTimeline.seedMs);
      const displayDate = hasSeededTimeline
        ? new Date(
            seededTimeline.seedMs +
              Math.max(Date.now() - seededTimeline.anchorMs, 0)
          )
        : new Date();

      drawSecurityCamTimestamp(
        timestampTextureState,
        cameraLabel,
        frameAspect,
        DEFAULT_AISLE_LABEL,
        displayDate,
        isMobile
      );
    }

    uniforms.retroAffineDistortion.value = retroAffineDistortion;
    uniforms.retroColorBleeding.value = retroColorBleeding;
    uniforms.retroColorDepthSteps.value = retroColorDepthSteps;
    uniforms.retroCurvature.value = retroCurvature;
    uniforms.retroScanlineDensity.value = retroScanlineDensity;
    uniforms.retroScanlineIntensity.value = retroScanlineIntensity;
    uniforms.retroScanlineSpeed.value = retroScanlineSpeed;
    uniforms.retroVignetteIntensity.value = retroVignetteIntensity;
    uniforms.chromaticAberrationStrength.value = chromaticAberrationStrength;
    uniforms.chromaticAberrationScale.value = chromaticAberrationScale;
    uniforms.chromaticAberrationCenter.value.set(
      chromaticAberrationCenterX,
      chromaticAberrationCenterY
    );
    bloomUniforms.bloomStrength.value = bloomStrength;
    bloomUniforms.bloomRadius.value = bloomRadius;
    bloomUniforms.bloomThreshold.value = bloomThreshold;

    if (!postRef.current) return;
    postRef.current.render();
  }, 1);

  return null;
});

export default PostEffects;
