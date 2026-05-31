import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import {
  clamp,
  float,
  length,
  max,
  mix,
  pass,
  screenUV,
  smoothstep,
  step,
  uniform,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  BlackHoleSimulation,
  createBlackHoleGeometry,
} from '../utils/blackHoleSimulation';
import applySecurityCamOverlay from './SecurityCamOverlayNode';

const WORLD_ORIGIN = new THREE.Vector3();
const MAX_SCREEN_OUTER_RADIUS = 0.42;
const MOBILE_OVERLAY_BREAKPOINT = 900;
const DEFAULT_DESKTOP_OVERLAY_INSET_PX = 80;
const DEFAULT_MOBILE_OVERLAY_INSET_PX = 16;
const SURVEILLANCE_FRAME_ASPECT = 16 / 9;
const MOBILE_SURVEILLANCE_FRAME_ASPECT = 1;
const MOBILE_SURVEILLANCE_EFFECT_BOOST = 1.28;
const DEFAULT_BLACK_HOLE_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_BLACK_HOLE_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_BLACK_HOLE_SCALE = Object.freeze({ x: 1, y: 1, z: 1 });
const MIN_BLACK_HOLE_SCALE = 0.001;

function setVector3FromControl(target, value, fallback) {
  target.set(
    value?.x ?? fallback.x,
    value?.y ?? fallback.y,
    value?.z ?? fallback.z
  );

  return target;
}

function setEulerFromDegrees(target, value, fallback) {
  target.set(
    THREE.MathUtils.degToRad(value?.x ?? fallback.x),
    THREE.MathUtils.degToRad(value?.y ?? fallback.y),
    THREE.MathUtils.degToRad(value?.z ?? fallback.z)
  );

  return target;
}

function setScaleFromControl(target, value, fallback) {
  target.set(
    Math.max(value?.x ?? fallback.x, MIN_BLACK_HOLE_SCALE),
    Math.max(value?.y ?? fallback.y, MIN_BLACK_HOLE_SCALE),
    Math.max(value?.z ?? fallback.z, MIN_BLACK_HOLE_SCALE)
  );

  return target;
}

function getProjectedRadius(originProjection, pointProjection, aspect) {
  return Math.hypot(
    (pointProjection.x - originProjection.x) * 0.5 * aspect,
    (pointProjection.y - originProjection.y) * 0.5
  );
}

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

function getVisibleRect(node) {
  if (!node) {
    return null;
  }

  const rect = node.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0 ? rect : null;
}

function resolveSurveillanceFrameBounds(size) {
  const viewportWidth = Math.max(size.width, 1);
  const viewportHeight = Math.max(size.height, 1);
  const isMobileLayout = viewportWidth <= MOBILE_OVERLAY_BREAKPOINT;
  const defaultInsetPx = isMobileLayout
    ? DEFAULT_MOBILE_OVERLAY_INSET_PX
    : DEFAULT_DESKTOP_OVERLAY_INSET_PX;

  if (typeof document === 'undefined') {
    return {
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1,
      frameAspect: SURVEILLANCE_FRAME_ASPECT,
      effectBoost: 1,
    };
  }

  const overlayRoot = document.querySelector('.overlay');
  const isIgPost = overlayRoot?.classList.contains('overlay-ig-post');
  const targetAspect =
    isMobileLayout && isIgPost
      ? MOBILE_SURVEILLANCE_FRAME_ASPECT
      : SURVEILLANCE_FRAME_ASPECT;

  // Measure the live corner-panel boxes rather than reading CSS insets. The IG
  // framing offsets only move panels on some breakpoints, and the panels grow
  // with their content, so the rendered rects are the only reliable source of
  // "where the UI actually is". The top-right panel is intentionally excluded:
  // it resizes with Leva visibility, so we don't anchor the frame to it.
  const topLeftRect = getVisibleRect(
    overlayRoot?.querySelector('.top-left.overlay-panel')
  );
  const bottomLeftRect = getVisibleRect(
    overlayRoot?.querySelector('.bottom-left.overlay-panel')
  );
  const bottomRightRect = getVisibleRect(
    overlayRoot?.querySelector('.bottom-right.overlay-panel')
  );

  const defaultLeftPx = defaultInsetPx;
  const defaultRightPx = viewportWidth - defaultInsetPx;
  const defaultTopPx = defaultInsetPx;
  const defaultBottomPx = viewportHeight - defaultInsetPx;
  const clearanceGapPx = isMobileLayout ? 14 : 24;

  // Push the frame's top edge below the top-left panel and its bottom edge above
  // the bottom panels so the REC/timestamp/label HUD bands never land under the
  // app overlay chips. Left/right align to the chips' outer extent for a frame
  // that reads as one cohesive bezel with the UI.
  const safeTopPx = Math.min(
    (topLeftRect?.bottom ?? defaultTopPx) + clearanceGapPx,
    viewportHeight * 0.5 - 1
  );
  const safeBottomPx = Math.max(
    Math.min(
      bottomLeftRect?.top ?? defaultBottomPx,
      bottomRightRect?.top ?? defaultBottomPx
    ) - clearanceGapPx,
    viewportHeight * 0.5 + 1
  );
  const safeLeftPx = Math.min(
    topLeftRect?.left ?? defaultLeftPx,
    bottomLeftRect?.left ?? defaultLeftPx,
    viewportWidth * 0.5 - 1
  );
  const safeRightPx = Math.max(
    bottomRightRect?.right ?? defaultRightPx,
    viewportWidth * 0.5 + 1
  );

  const safeWidthPx = Math.max(safeRightPx - safeLeftPx, viewportWidth * 0.2);
  const safeHeightPx = Math.max(safeBottomPx - safeTopPx, viewportHeight * 0.2);
  let frameWidthPx = safeWidthPx;
  let frameHeightPx = frameWidthPx / targetAspect;

  if (frameHeightPx > safeHeightPx) {
    frameHeightPx = safeHeightPx;
    frameWidthPx = frameHeightPx * targetAspect;
  }

  const safeCenterX = (safeLeftPx + safeRightPx) * 0.5;
  const safeCenterY = (safeTopPx + safeBottomPx) * 0.5;
  const frameMinX = safeCenterX - frameWidthPx * 0.5;
  const frameMaxX = safeCenterX + frameWidthPx * 0.5;
  // DOM-space edges: y grows downward, so frameTopPx is the top edge.
  const frameTopPx = safeCenterY - frameHeightPx * 0.5;
  const frameBottomPx = safeCenterY + frameHeightPx * 0.5;

  return {
    minX: clamp01(frameMinX / viewportWidth),
    maxX: clamp01(frameMaxX / viewportWidth),
    // screenUV in WebGPU TSL has its origin at the bottom-left (y grows up),
    // while DOM coordinates grow down. Flip Y so the frame lands in the correct
    // half of the viewport for asymmetric (IG Post) insets.
    minY: clamp01(1 - frameBottomPx / viewportHeight),
    maxY: clamp01(1 - frameTopPx / viewportHeight),
    // Aspect of the rendered frame, so the HUD canvas can match it and scale
    // uniformly instead of stretching (keeps desktop and mobile identical).
    frameAspect: frameWidthPx / Math.max(frameHeightPx, 1),
    effectBoost: isMobileLayout ? MOBILE_SURVEILLANCE_EFFECT_BOOST : 1,
  };
}

function padTimestampSegment(value) {
  return String(value).padStart(2, '0');
}

function formatSecurityCamTimestamp(date) {
  const dateLabel = [
    date.getFullYear(),
    padTimestampSegment(date.getMonth() + 1),
    padTimestampSegment(date.getDate()),
  ].join('-');

  return `${dateLabel} ${padTimestampSegment(
    date.getHours()
  )}:${padTimestampSegment(date.getMinutes())}:${padTimestampSegment(
    date.getSeconds()
  )}`;
}

// HUD text canvas. Width is fixed; height tracks the frame aspect so the
// canvas scales uniformly into the frame (no glyph stretching). Layout is
// anchored to the same normalized insets the shader uses for the bracket lines
// (frameInset = 0.044 in SecurityCamOverlayNode), with symmetric margins, so
// REC/timestamp/label sit a consistent distance inside the lines at any aspect.
const HUD_CANVAS_WIDTH = 2048;
const HUD_FRAME_INSET = 0.044;
const HUD_LINE_MARGIN = 0.022;
const HUD_MIN_ASPECT = 0.7;
const HUD_MAX_ASPECT = 3.2;

function createSecurityCamTimestampTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = HUD_CANVAS_WIDTH;
  canvas.height = Math.round(HUD_CANVAS_WIDTH / SURVEILLANCE_FRAME_ASPECT);

  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return {
    canvas,
    context,
    texture,
    contentKey: null,
  };
}

function drawSecurityCamTimestamp(
  textureState,
  cameraLabel = 'CAM 01',
  frameAspect = SURVEILLANCE_FRAME_ASPECT,
  date = new Date()
) {
  if (!textureState?.context) {
    return;
  }

  const nextTextureState = textureState;
  const { canvas, context, texture } = nextTextureState;

  // Match the canvas aspect to the rendered frame so the HUD scales uniformly
  // into it. Resizing the canvas clears it, so force a redraw when it changes.
  const clampedAspect = Math.min(
    Math.max(frameAspect, HUD_MIN_ASPECT),
    HUD_MAX_ASPECT
  );
  const targetHeight = Math.round(HUD_CANVAS_WIDTH / clampedAspect);

  if (canvas.height !== targetHeight) {
    canvas.height = targetHeight;
    nextTextureState.contentKey = null;
  }

  const timestampKey = Math.floor(date.getTime() / 1000);
  const contentKey = `${cameraLabel}:${timestampKey}:${targetHeight}`;

  if (nextTextureState.contentKey === contentKey) {
    return;
  }

  nextTextureState.contentKey = contentKey;

  const { width, height } = canvas;
  const timestampLabel = formatSecurityCamTimestamp(date);
  const recLabel = 'REC';

  // Canvas pixels are square (canvas aspect == frame aspect), so one px is the
  // same on-screen distance on every axis. Express all gaps in canvas px for
  // symmetric, aspect-independent padding from the bracket lines.
  const insetX = width * HUD_FRAME_INSET;
  const insetY = height * HUD_FRAME_INSET;
  const margin = width * HUD_LINE_MARGIN;
  const contentLeft = insetX + margin;
  const contentRight = width - insetX - margin;
  const availableTopWidth = Math.max(contentRight - contentLeft, 1);

  let recFontSize = width * 0.026;
  let timestampFontSize = width * 0.023;
  let dotRadius = width * 0.011;
  let dotGap = width * 0.009;
  const clusterGap = width * 0.022;

  context.clearRect(0, 0, width, height);
  // A strong dark shadow doubles as a legibility halo: when the labels are
  // alpha-composited in the shader, this dark fringe keeps them readable over
  // bright scene content.
  context.shadowColor = 'rgba(0, 0, 0, 0.85)';
  context.shadowBlur = width * 0.011;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;

  // Scale the top row to fit between the lines so it never overflows them.
  context.font = `700 ${recFontSize}px 'Courier New', monospace`;
  const recTextWidth = context.measureText(recLabel).width;
  context.font = `700 ${timestampFontSize}px 'Courier New', monospace`;
  const timestampWidth = context.measureText(timestampLabel).width;
  const requiredTopWidth =
    dotRadius * 2 + dotGap + recTextWidth + clusterGap + timestampWidth;
  const topScale = Math.min(1, availableTopWidth / requiredTopWidth);

  recFontSize *= topScale;
  timestampFontSize *= topScale;
  dotRadius *= topScale;
  dotGap *= topScale;

  const topBaselineY = insetY + margin;

  // REC indicator (dot + label), left-aligned just inside the left line.
  context.textBaseline = 'middle';
  context.beginPath();
  context.fillStyle = 'rgba(214, 12, 24, 1)';
  context.arc(
    contentLeft + dotRadius,
    topBaselineY + recFontSize * 0.5,
    dotRadius,
    0,
    Math.PI * 2
  );
  context.fill();

  context.font = `700 ${recFontSize}px 'Courier New', monospace`;
  context.fillStyle = 'rgba(214, 12, 24, 1)';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillText(
    recLabel,
    contentLeft + dotRadius * 2 + dotGap,
    topBaselineY
  );

  // Timestamp, right-aligned just inside the right line.
  context.font = `700 ${timestampFontSize}px 'Courier New', monospace`;
  context.fillStyle = 'rgba(226, 255, 240, 1)';
  context.textAlign = 'right';
  context.fillText(timestampLabel, contentRight, topBaselineY);

  // Camera label, centered just inside the bottom line.
  let cameraFontSize = width * 0.026;
  context.font = `600 ${cameraFontSize}px 'Courier New', monospace`;
  const cameraWidth = context.measureText(cameraLabel).width;
  const cameraScale = Math.min(1, availableTopWidth / Math.max(cameraWidth, 1));
  cameraFontSize *= cameraScale;

  context.font = `600 ${cameraFontSize}px 'Courier New', monospace`;
  context.fillStyle = 'rgba(220, 255, 238, 0.98)';
  context.textAlign = 'center';
  context.textBaseline = 'bottom';
  context.fillText(cameraLabel, width * 0.5, height - insetY - margin);

  texture.needsUpdate = true;
}

const PostEffects = memo(function PostEffects({ config }) {
  const { gl: renderer, scene, camera, size } = useThree();
  const postRef = useRef(null);
  const timestampTextureState = useMemo(createSecurityCamTimestampTexture, []);
  const originProjectionRef = useRef(new THREE.Vector3());
  const originViewRef = useRef(new THREE.Vector3());
  const innerProjectionRef = useRef(new THREE.Vector3());
  const outerProjectionRef = useRef(new THREE.Vector3());
  const innerWorldRef = useRef(new THREE.Vector3());
  const outerWorldRef = useRef(new THREE.Vector3());
  const blackHoleTransformRef = useRef({
    localToWorldMatrix: new THREE.Matrix4(),
    worldToLocalMatrix: new THREE.Matrix4(),
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3(1, 1, 1),
    originWorld: new THREE.Vector3(),
    innerDepthWorld: new THREE.Vector3(),
    outerDepthWorld: new THREE.Vector3(),
    innerDepthProjection: new THREE.Vector3(),
    outerDepthProjection: new THREE.Vector3(),
  });
  const simulation = useMemo(() => new BlackHoleSimulation(config, size), []);
  const geometry = useMemo(() => createBlackHoleGeometry(), []);
  const material = useMemo(() => simulation.createMaterial(), [simulation]);
  const maskMaterial = useMemo(
    () => simulation.createMaskMaterial(),
    [simulation]
  );
  const blackHoleScene = useMemo(() => {
    const nextScene = new THREE.Scene();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    nextScene.add(mesh);
    return nextScene;
  }, [geometry, material]);
  const blackHoleMaskScene = useMemo(() => {
    const nextScene = new THREE.Scene();
    const mesh = new THREE.Mesh(geometry, maskMaterial);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    nextScene.add(mesh);
    return nextScene;
  }, [geometry, maskMaterial]);
  const blackHoleConfig = useMemo(
    () =>
      config.presentationMode === 'storeWarp'
        ? {
            ...config,
            starsEnabled: false,
            nebulaEnabled: false,
            backgroundOpacity: 0,
            starBackgroundColor: '#000000',
          }
        : { ...config, backgroundOpacity: 1 },
    [config]
  );
  const uniforms = useMemo(
    () => ({
      aspect: uniform(size.width / Math.max(size.height, 1)),
      center: uniform(new THREE.Vector2(0.5, 0.5)),
      effectVisibility: uniform(1),
      holeDepth: uniform(1),
      blackHoleMass: uniform(config.blackHoleMass),
      gravitationalLensing: uniform(config.gravitationalLensing),
      screenInnerRadius: uniform(0.05),
      screenOuterRadius: uniform(0.18),
      bloomThreshold: uniform(config.bloomThreshold),
      bloomStrength: uniform(config.bloomStrength),
      surveillanceStoreEnabled: uniform(
        config.presentationMode === 'storeWarp' ? 1 : 0
      ),
      surveillanceFxEnabled: uniform(config.surveillanceFxEnabled ? 1 : 0),
      surveillanceOverlayEnabled: uniform(
        config.surveillanceOverlayEnabled ? 1 : 0
      ),
      surveillanceDesaturation: uniform(config.surveillanceDesaturation),
      surveillanceNoiseAmount: uniform(config.surveillanceNoiseAmount),
      surveillanceScanlineStrength: uniform(
        config.surveillanceScanlineStrength
      ),
      surveillanceScanlineDensity: uniform(config.surveillanceScanlineDensity),
      surveillanceVignette: uniform(config.surveillanceVignette),
      surveillanceRollingBandStrength: uniform(
        config.surveillanceRollingBandStrength
      ),
      surveillanceHudOpacity: uniform(config.surveillanceHudOpacity),
      surveillanceEffectBoost: uniform(1),
      surveillanceFrameMin: uniform(new THREE.Vector2(0, 0)),
      surveillanceFrameMax: uniform(new THREE.Vector2(1, 1)),
      surveillanceTime: uniform(0),
    }),
    []
  );

  useEffect(() => {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }, [renderer]);

  useEffect(() => {
    material.depthTest = false;
    material.depthWrite = false;
  }, [material]);

  useEffect(() => {
    maskMaterial.depthTest = false;
    maskMaterial.depthWrite = false;
  }, [maskMaterial]);

  useEffect(() => {
    uniforms.blackHoleMass.value = config.blackHoleMass;
    uniforms.gravitationalLensing.value = config.gravitationalLensing;
    uniforms.bloomThreshold.value = config.bloomThreshold;
    uniforms.bloomStrength.value = config.bloomStrength;
    uniforms.surveillanceStoreEnabled.value =
      config.presentationMode === 'storeWarp' ? 1 : 0;
    uniforms.surveillanceFxEnabled.value = config.surveillanceFxEnabled ? 1 : 0;
    uniforms.surveillanceOverlayEnabled.value =
      config.surveillanceOverlayEnabled ? 1 : 0;
    uniforms.surveillanceDesaturation.value = config.surveillanceDesaturation;
    uniforms.surveillanceNoiseAmount.value = config.surveillanceNoiseAmount;
    uniforms.surveillanceScanlineStrength.value =
      config.surveillanceScanlineStrength;
    uniforms.surveillanceScanlineDensity.value =
      config.surveillanceScanlineDensity;
    uniforms.surveillanceVignette.value = config.surveillanceVignette;
    uniforms.surveillanceRollingBandStrength.value =
      config.surveillanceRollingBandStrength;
    uniforms.surveillanceHudOpacity.value = config.surveillanceHudOpacity;
  }, [config, uniforms]);

  useEffect(() => {
    simulation.updateUniforms(blackHoleConfig);
  }, [blackHoleConfig, simulation]);

  useEffect(() => {
    uniforms.aspect.value = size.width / Math.max(size.height, 1);
    simulation.onResize(size.width, size.height);
  }, [simulation, size.height, size.width, uniforms]);

  useEffect(() => {
    return () => {
      material.dispose();
      maskMaterial.dispose();
      geometry.dispose();
      timestampTextureState.texture.dispose();
    };
  }, [geometry, maskMaterial, material, timestampTextureState]);

  useEffect(() => {
    if (!renderer || !scene || !camera) {
      return undefined;
    }

    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode();
    const sceneDepth = scenePass.getTextureNode('depth');
    const blackHolePass = pass(blackHoleScene, camera);
    const blackHoleColor = blackHolePass.getTextureNode();
    const blackHoleMaskPass = pass(blackHoleMaskScene, camera);
    const blackHoleMask = blackHoleMaskPass.getTextureNode();
    // Per-pixel device depth of the hole's disk/core hit (far plane where empty).
    const blackHoleDepth = blackHoleMaskPass.getTextureNode('depth');

    const baseScene =
      config.presentationMode === 'backgroundField'
        ? (() => {
            // Gravitationally warp the scene (orbiting bodies) toward the hole,
            // matching the store branch, so the moons get lensed near the hole.
            const effectVisibility = uniforms.effectVisibility.clamp(0.0, 1.0);
            const centeredUv = vec2(
              screenUV.x.sub(uniforms.center.x).mul(uniforms.aspect),
              screenUV.y.sub(uniforms.center.y)
            );
            const dist = length(centeredUv);
            const innerRadius = uniforms.screenInnerRadius.max(0.02);
            const outerRadius = uniforms.screenOuterRadius.max(
              innerRadius.add(0.02)
            );
            const coreRadius = innerRadius
              .mul(0.58)
              .max(uniforms.blackHoleMass.mul(0.015));
            const lensRadius = outerRadius.mul(1.35).add(coreRadius.mul(0.55));
            const safeDist = dist.max(0.0001);
            const direction = centeredUv.div(safeDist);
            const directionUv = vec2(
              direction.x.div(uniforms.aspect),
              direction.y
            );
            const lensMask = float(1.0)
              .sub(smoothstep(coreRadius, lensRadius, dist))
              .mul(effectVisibility);
            const warpStrength = uniforms.gravitationalLensing
              .mul(lensMask.mul(lensMask).add(lensMask.mul(0.2)))
              .mul(outerRadius.mul(0.32).add(coreRadius.mul(0.65)));
            const warpedUvRaw = vec2(
              screenUV.x.sub(directionUv.x.mul(warpStrength)),
              screenUV.y.sub(directionUv.y.mul(warpStrength))
            );
            const safeWarpedUv = vec2(
              clamp(warpedUvRaw.x, 0.0, 1.0),
              clamp(warpedUvRaw.y, 0.0, 1.0)
            );

            // Sample the (lensed) scene; per-pixel hole depth resolves whether a
            // body is in front of or behind the hole — no more flat-plane pop.
            const sampledSceneDepth = sceneDepth.sample(safeWarpedUv);
            const sampledHoleDepth = blackHoleDepth.sample(screenUV);
            const sceneGeometryMask = float(1.0).sub(
              step(0.9999, sampledSceneDepth)
            );
            const objectInFrontOfHoleMask = step(
              sampledSceneDepth,
              sampledHoleDepth.sub(0.0015)
            );
            const visibleSceneMask = sceneGeometryMask.mul(
              max(
                float(1.0).sub(blackHoleMask.r.clamp(0.0, 1.0)),
                objectInFrontOfHoleMask
              )
            );

            return mix(
              blackHoleColor,
              sceneColor.sample(safeWarpedUv),
              visibleSceneMask
            );
          })()
        : (() => {
            const effectVisibility = uniforms.effectVisibility.clamp(0.0, 1.0);
            const centeredUv = vec2(
              screenUV.x.sub(uniforms.center.x).mul(uniforms.aspect),
              screenUV.y.sub(uniforms.center.y)
            );
            const dist = length(centeredUv);
            const innerRadius = uniforms.screenInnerRadius.max(0.02);
            const outerRadius = uniforms.screenOuterRadius.max(
              innerRadius.add(0.02)
            );
            const coreRadius = innerRadius
              .mul(0.58)
              .max(uniforms.blackHoleMass.mul(0.015));
            const lensRadius = outerRadius.mul(1.35).add(coreRadius.mul(0.55));
            const safeDist = dist.max(0.0001);
            const direction = centeredUv.div(safeDist);
            const directionUv = vec2(
              direction.x.div(uniforms.aspect),
              direction.y
            );
            const holeVisibleMask = step(
              blackHoleDepth.sample(screenUV).sub(0.0015),
              sceneDepth.sample(screenUV)
            ).mul(effectVisibility);
            const blackHoleAlpha = blackHoleMask.r
              .mul(holeVisibleMask)
              .clamp(0.0, 1.0);
            const lensMask = float(1.0).sub(
              smoothstep(coreRadius, lensRadius, dist)
            );
            const visibleLensMask = lensMask.mul(holeVisibleMask);
            const warpStrength = uniforms.gravitationalLensing
              .mul(
                visibleLensMask
                  .mul(visibleLensMask)
                  .add(visibleLensMask.mul(0.2))
              )
              .mul(outerRadius.mul(0.32).add(coreRadius.mul(0.65)));
            const warpedUvRaw = vec2(
              screenUV.x.sub(directionUv.x.mul(warpStrength)),
              screenUV.y.sub(directionUv.y.mul(warpStrength))
            );
            const safeWarpedUv = vec2(
              clamp(warpedUvRaw.x, 0.0, 1.0),
              clamp(warpedUvRaw.y, 0.0, 1.0)
            );
            const inBoundsMask = step(0.0, warpedUvRaw.x)
              .mul(step(warpedUvRaw.x, 1.0))
              .mul(step(0.0, warpedUvRaw.y))
              .mul(step(warpedUvRaw.y, 1.0));
            const warpedStore = mix(
              sceneColor.sample(screenUV).rgb,
              sceneColor.sample(safeWarpedUv).rgb,
              inBoundsMask.mul(holeVisibleMask)
            );
            const dimmedStore = warpedStore.mul(
              float(1.0).sub(
                visibleLensMask.mul(0.08).add(blackHoleAlpha.mul(0.45))
              )
            );
            const withBlackHole = dimmedStore
              .mul(float(1.0).sub(blackHoleAlpha))
              .add(blackHoleColor.rgb.mul(effectVisibility));

            return vec4(withBlackHole, 1.0);
          })();

    const bloomContribution = config.bloomEnabled
      ? gaussianBlur(
          max(baseScene.sub(uniforms.bloomThreshold), 0.0),
          config.bloomRadius,
          6,
          {
            resolutionScale: 1 / config.bloomDownSampleRatio,
          }
        ).mul(uniforms.bloomStrength)
      : vec4(0, 0, 0, 0);

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = applySecurityCamOverlay(
      baseScene.add(bloomContribution),
      uniforms,
      timestampTextureState.texture
    );
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
    };
  }, [
    camera,
    config.bloomDownSampleRatio,
    config.bloomEnabled,
    config.bloomRadius,
    config.presentationMode,
    blackHoleMaskScene,
    blackHoleScene,
    renderer,
    scene,
    timestampTextureState,
    uniforms,
  ]);

  useFrame((state, deltaTime) => {
    const aspect = size.width / Math.max(size.height, 1);
    const blackHoleTransform = blackHoleTransformRef.current;
    const surveillanceFrameBounds = resolveSurveillanceFrameBounds(size);

    setVector3FromControl(
      blackHoleTransform.position,
      config.blackHolePosition,
      DEFAULT_BLACK_HOLE_POSITION
    );
    setEulerFromDegrees(
      blackHoleTransform.rotation,
      config.blackHoleRotation,
      DEFAULT_BLACK_HOLE_ROTATION
    );
    setScaleFromControl(
      blackHoleTransform.scale,
      config.blackHoleScale,
      DEFAULT_BLACK_HOLE_SCALE
    );
    blackHoleTransform.quaternion.setFromEuler(blackHoleTransform.rotation);
    blackHoleTransform.localToWorldMatrix.compose(
      blackHoleTransform.position,
      blackHoleTransform.quaternion,
      blackHoleTransform.scale
    );
    blackHoleTransform.worldToLocalMatrix
      .copy(blackHoleTransform.localToWorldMatrix)
      .invert();

    blackHoleTransform.originWorld
      .copy(WORLD_ORIGIN)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);
    originProjectionRef.current
      .copy(blackHoleTransform.originWorld)
      .project(camera);
    originViewRef.current
      .copy(blackHoleTransform.originWorld)
      .applyMatrix4(camera.matrixWorldInverse);

    simulation.update(
      deltaTime,
      camera,
      blackHoleTransform.worldToLocalMatrix,
      blackHoleTransform.localToWorldMatrix
    );

    innerWorldRef.current
      .set(config.diskInnerRadius, 0, 0)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);
    outerWorldRef.current
      .set(config.diskOuterRadius, 0, 0)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);
    blackHoleTransform.innerDepthWorld
      .set(0, 0, config.diskInnerRadius)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);
    blackHoleTransform.outerDepthWorld
      .set(0, 0, config.diskOuterRadius)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);

    innerProjectionRef.current.copy(innerWorldRef.current).project(camera);
    outerProjectionRef.current.copy(outerWorldRef.current).project(camera);
    blackHoleTransform.innerDepthProjection
      .copy(blackHoleTransform.innerDepthWorld)
      .project(camera);
    blackHoleTransform.outerDepthProjection
      .copy(blackHoleTransform.outerDepthWorld)
      .project(camera);

    const projectedInnerRadius = Math.max(
      getProjectedRadius(
        originProjectionRef.current,
        innerProjectionRef.current,
        aspect
      ),
      getProjectedRadius(
        originProjectionRef.current,
        blackHoleTransform.innerDepthProjection,
        aspect
      )
    );
    const projectedOuterRadius = Math.max(
      getProjectedRadius(
        originProjectionRef.current,
        outerProjectionRef.current,
        aspect
      ),
      getProjectedRadius(
        originProjectionRef.current,
        blackHoleTransform.outerDepthProjection,
        aspect
      )
    );
    const safeProjectedInnerRadius = Number.isFinite(projectedInnerRadius)
      ? projectedInnerRadius
      : 0;
    const safeProjectedOuterRadius = Number.isFinite(projectedOuterRadius)
      ? projectedOuterRadius
      : 0;
    const radiusScale =
      safeProjectedOuterRadius > MAX_SCREEN_OUTER_RADIUS
        ? MAX_SCREEN_OUTER_RADIUS / safeProjectedOuterRadius
        : 1;
    const screenInnerRadius = safeProjectedInnerRadius
      ? Math.max(safeProjectedInnerRadius * radiusScale, 0.02)
      : 0;
    const screenOuterRadius = safeProjectedOuterRadius
      ? Math.max(
          safeProjectedOuterRadius * radiusScale,
          screenInnerRadius + 0.02
        )
      : 0;
    const rawCenterX = originProjectionRef.current.x * 0.5 + 0.5;
    const rawCenterY = originProjectionRef.current.y * 0.5 + 0.5;
    const projectedDepthSamples = [
      originProjectionRef.current.z,
      innerProjectionRef.current.z,
      outerProjectionRef.current.z,
      blackHoleTransform.innerDepthProjection.z,
      blackHoleTransform.outerDepthProjection.z,
    ]
      .map((projectionZ) => projectionZ * 0.5 + 0.5)
      .filter((depth) => Number.isFinite(depth) && depth >= 0 && depth <= 1);
    const holeInFront = originViewRef.current.z < -config.cameraNear;
    const intersectsViewport =
      rawCenterX + screenOuterRadius >= 0 &&
      rawCenterX - screenOuterRadius <= 1 &&
      rawCenterY + screenOuterRadius >= 0 &&
      rawCenterY - screenOuterRadius <= 1;
    const effectVisibility =
      holeInFront &&
      Number.isFinite(rawCenterX) &&
      Number.isFinite(rawCenterY) &&
      screenOuterRadius > 0 &&
      projectedDepthSamples.length > 0 &&
      intersectsViewport
        ? 1
        : 0;
    const holeDepth =
      effectVisibility > 0 ? Math.min(...projectedDepthSamples) : 1;

    uniforms.aspect.value = aspect;
    uniforms.center.value.set(rawCenterX, rawCenterY);
    uniforms.effectVisibility.value = effectVisibility;
    uniforms.holeDepth.value = holeDepth;
    uniforms.screenInnerRadius.value = screenInnerRadius;
    uniforms.screenOuterRadius.value = screenOuterRadius;
    uniforms.surveillanceTime.value = state.clock.elapsedTime;
    uniforms.surveillanceEffectBoost.value =
      surveillanceFrameBounds.effectBoost;
    uniforms.surveillanceFrameMin.value.set(
      surveillanceFrameBounds.minX,
      surveillanceFrameBounds.minY
    );
    uniforms.surveillanceFrameMax.value.set(
      surveillanceFrameBounds.maxX,
      surveillanceFrameBounds.maxY
    );

    if (config.surveillanceOverlayEnabled) {
      drawSecurityCamTimestamp(
        timestampTextureState,
        config.surveillanceCameraLabel,
        surveillanceFrameBounds.frameAspect
      );
    }

    if (!postRef.current) {
      return;
    }

    postRef.current.render();
  }, 1);

  return null;
});

export default PostEffects;
