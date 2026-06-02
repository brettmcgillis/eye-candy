import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import applySecurityCamOverlay from './SecurityCamOverlayNode';

export const SINGULARITY_BLOOM_LAYER = 11;

const SOURCE_BLOOM_STRENGTH = 0.217;
const SOURCE_BLOOM_RADIUS = 0;
const SOURCE_BLOOM_THRESHOLD = 0;
const SOURCE_HUD_OPACITY = 0.56;
const SOURCE_TONE_MAPPING_EXPOSURE = 1.2;

const MOBILE_OVERLAY_BREAKPOINT = 900;
const DEFAULT_DESKTOP_OVERLAY_INSET_PX = 80;
const DEFAULT_MOBILE_OVERLAY_INSET_PX = 16;
const SURVEILLANCE_FRAME_ASPECT = 16 / 9;
const MOBILE_SURVEILLANCE_FRAME_ASPECT = 1;
const MOBILE_SURVEILLANCE_EFFECT_BOOST = 1.28;
const HUD_CANVAS_WIDTH = 2048;
const HUD_FRAME_INSET = 0.044;
const HUD_LINE_MARGIN = 0.022;
const HUD_MIN_ASPECT = 0.7;
const HUD_MAX_ASPECT = 3.2;
const DEFAULT_CAMERA_LABEL = 'CAM 01';
const DEFAULT_AISLE_LABEL = 'AISLE 9';
const REC_DOT_BLINK_INTERVAL_MS = 500;

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

function getVisibleRect(node) {
  if (!node) return null;

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
  const frameTopPx = safeCenterY - frameHeightPx * 0.5;
  const frameBottomPx = safeCenterY + frameHeightPx * 0.5;

  return {
    minX: clamp01(frameMinX / viewportWidth),
    maxX: clamp01(frameMaxX / viewportWidth),
    minY: clamp01(1 - frameBottomPx / viewportHeight),
    maxY: clamp01(1 - frameTopPx / viewportHeight),
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

  return `${dateLabel} ${padTimestampSegment(date.getHours())}:${padTimestampSegment(date.getMinutes())}:${padTimestampSegment(date.getSeconds())}`;
}

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

  return { canvas, context, texture, contentKey: null };
}

function drawSecurityCamTimestamp(
  textureState,
  cameraLabel = DEFAULT_CAMERA_LABEL,
  frameAspect = SURVEILLANCE_FRAME_ASPECT,
  aisleLabel = DEFAULT_AISLE_LABEL,
  date = new Date()
) {
  if (!textureState?.context) return;

  const nextTextureState = textureState;
  const { canvas, context, texture } = nextTextureState;
  const clampedAspect = Math.min(
    Math.max(frameAspect, HUD_MIN_ASPECT),
    HUD_MAX_ASPECT
  );
  const targetHeight = Math.round(HUD_CANVAS_WIDTH / clampedAspect);

  if (canvas.height !== targetHeight) {
    canvas.height = targetHeight;
    nextTextureState.contentKey = null;
  }

  const nowMs = date.getTime();
  const timestampKey = Math.floor(nowMs / 1000);
  const recDotBlinkKey = Math.floor(nowMs / REC_DOT_BLINK_INTERVAL_MS);
  const recDotVisible = recDotBlinkKey % 2 === 0;
  const contentKey = `${cameraLabel}:${aisleLabel}:${timestampKey}:${recDotBlinkKey}:${targetHeight}`;

  if (nextTextureState.contentKey === contentKey) return;

  nextTextureState.contentKey = contentKey;

  const { width, height } = canvas;
  const timestampLabel = formatSecurityCamTimestamp(date);
  const recLabel = 'REC';
  const insetX = width * HUD_FRAME_INSET;
  const insetY = height * HUD_FRAME_INSET;
  const margin = width * HUD_LINE_MARGIN;
  const contentLeft = insetX + margin;
  const contentRight = width - insetX - margin;
  const availableWidth = Math.max(contentRight - contentLeft, 1);
  const topGap = width * 0.022;
  const bottomGap = width * 0.04;

  let recFontSize = width * 0.026;
  let timestampFontSize = width * 0.023;
  let dotRadius = width * 0.011;
  let dotGap = width * 0.009;

  context.clearRect(0, 0, width, height);
  context.shadowColor = 'rgba(0, 0, 0, 0.85)';
  context.shadowBlur = width * 0.011;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;

  context.font = `700 ${recFontSize}px 'Courier New', monospace`;
  const recTextWidth = context.measureText(recLabel).width;
  context.font = `700 ${timestampFontSize}px 'Courier New', monospace`;
  const timestampWidth = context.measureText(timestampLabel).width;
  const requiredTopWidth =
    dotRadius * 2 + dotGap + recTextWidth + topGap + timestampWidth;
  const topScale = Math.min(1, availableWidth / requiredTopWidth);

  recFontSize *= topScale;
  timestampFontSize *= topScale;
  dotRadius *= topScale;
  dotGap *= topScale;

  const topBaselineY = insetY + margin;

  context.textBaseline = 'middle';
  if (recDotVisible) {
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
  }

  context.font = `700 ${recFontSize}px 'Courier New', monospace`;
  context.fillStyle = 'rgba(214, 12, 24, 1)';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillText(
    recLabel,
    contentLeft + dotRadius * 2 + dotGap,
    topBaselineY
  );

  context.font = `700 ${timestampFontSize}px 'Courier New', monospace`;
  context.fillStyle = 'rgba(226, 255, 240, 1)';
  context.textAlign = 'right';
  context.fillText(timestampLabel, contentRight, topBaselineY);

  let bottomFontSize = width * 0.026;
  context.font = `600 ${bottomFontSize}px 'Courier New', monospace`;
  const cameraWidth = context.measureText(cameraLabel).width;
  const aisleWidth = context.measureText(aisleLabel).width;
  const requiredBottomWidth = cameraWidth + aisleWidth + bottomGap;
  const bottomScale = Math.min(1, availableWidth / requiredBottomWidth);
  bottomFontSize *= bottomScale;

  const bottomBaselineY = height - insetY - margin;

  context.font = `600 ${bottomFontSize}px 'Courier New', monospace`;
  context.fillStyle = 'rgba(220, 255, 238, 0.98)';
  context.textBaseline = 'bottom';
  context.textAlign = 'left';
  context.fillText(cameraLabel, contentLeft, bottomBaselineY);
  context.textAlign = 'right';
  context.fillText(aisleLabel, contentRight, bottomBaselineY);

  texture.needsUpdate = true;
}

const PostEffects = memo(function PostEffects({
  bloomEnabled,
  cameraLabel,
  overlayEnabled,
}) {
  const { gl: renderer, scene, camera, size } = useThree();
  const postRef = useRef(null);
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
    }),
    []
  );

  useEffect(() => {
    uniforms.surveillanceOverlayEnabled.value = overlayEnabled ? 1 : 0;
  }, [overlayEnabled, uniforms]);

  useEffect(
    () => () => {
      timestampTextureState.texture.dispose();
    },
    [timestampTextureState]
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) {
      return undefined;
    }

    const previousToneMapping = renderer.toneMapping;
    const previousToneMappingExposure = renderer.toneMappingExposure;
    const previousOutputColorSpace = renderer.outputColorSpace;

    if (bloomEnabled) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = SOURCE_TONE_MAPPING_EXPOSURE;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    const scenePass = pass(scene, camera);
    const postProcessing = new THREE.PostProcessing(renderer);
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
    camera,
    overlayEnabled,
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

      const surveillanceFrameBounds = cachedFrameBoundsRef.current;
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

      drawSecurityCamTimestamp(
        timestampTextureState,
        cameraLabel,
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
