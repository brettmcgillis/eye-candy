import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three';

import { getK } from '../utils/ruleTables';

const DEG_TO_RAD = Math.PI / 180;
const KEY_LIGHT_DISTANCE_SCALE = 2.69284236449147;
const SKY_COLOR = '#b9d4ff';
const GROUND_COLOR = '#030403';
const KEY_COLOR = '#fff0d3';
const RIM_COLOR = '#70a8ff';
const BOUNCE_COLOR = '#8dd06e';
const SHADOW_MAP_SIZE = 2048;
const SHADOW_BIAS = -0.00035;
const SHADOW_NORMAL_BIAS = 0.045;
// SHADOW_BIAS/SHADOW_NORMAL_BIAS above were tuned against this scene's
// typical default cellSpacing (0.6) — normalBias in particular is a fixed
// world-space offset meant to be a small fraction of the smallest rendered
// cube's own size, to dodge shadow-map texel imprecision without pushing the
// sample point clean through thin geometry. Voxel detail enhancement
// (VoxelField.jsx) renders a second, half-size tier of cubes alongside the
// normal ones; left at the coarse-tuned absolute bias, that fine tier's
// cubes are thin enough (relative to the same fixed offset) to self-shadow
// incorrectly — visible as dark speckling/acne dithered across the surface,
// worse on the finer cubes than the coarser ones. Scaling bias by the
// smallest active cell size relative to this reference keeps existing
// (non-detail-enhance) presets' shadows completely unchanged.
const SHADOW_BIAS_REFERENCE_CELL_SPACING = 0.6;

// Ports ~/dev/examples/260708_AutomataChunks's own light rig
// (voxelRenderer.ts's updateLightRig/applyRenderSettings) near-verbatim: a
// hemisphere sky/ground fill, a shadow-casting key light orbiting azimuth/
// elevation, and fixed-position rim + bounce fills — all scaled off the
// structure's world extent (k * cellSpacing) so the rig reframes itself
// whenever `level`/`cellSpacing` change. `exposure` mutates the shared
// renderer's toneMappingExposure directly (same pattern as Apparitions'
// Environment.jsx) and is restored on unmount so it doesn't leak into other
// scenes sharing this renderer.
function LightRig({ config }) {
  const { gl } = useThree();
  const keyLightRef = useRef(null);
  const exposureSnapshotRef = useRef(null);

  const keyTarget = useMemo(() => new THREE.Object3D(), []);
  const rimTarget = useMemo(() => new THREE.Object3D(), []);
  const bounceTarget = useMemo(() => new THREE.Object3D(), []);

  const extent = useMemo(() => {
    const k = getK(config.level);
    return Math.max(24 * config.cellSpacing, k * config.cellSpacing);
  }, [config.level, config.cellSpacing]);

  const targetY = extent * 0.12;
  const azimuth = config.lightAzimuth * DEG_TO_RAD;
  const elevation = config.lightElevation * DEG_TO_RAD;
  const lightDistance = extent * KEY_LIGHT_DISTANCE_SCALE;
  const horizontalDistance = Math.cos(elevation) * lightDistance;
  const keyPosition = [
    Math.cos(azimuth) * horizontalDistance,
    targetY + Math.sin(elevation) * lightDistance,
    Math.sin(azimuth) * horizontalDistance,
  ];
  const rimPosition = [extent * 1.4, extent * 0.95, -extent * 1.4];
  const bouncePosition = [extent * 0.8, -extent * 0.15, extent * 1.05];

  useEffect(() => {
    keyTarget.position.set(0, targetY, 0);
    rimTarget.position.set(0, targetY, 0);
    bounceTarget.position.set(0, targetY * 0.4, 0);
  }, [targetY, keyTarget, rimTarget, bounceTarget]);

  // Shadow-camera frustum bounds need an explicit updateProjectionMatrix()
  // after being set — R3F's declarative dash-props don't call it, so this
  // stays imperative (matches the reference's own updateLightRig).
  useEffect(() => {
    const light = keyLightRef.current;
    if (!light) return;
    const shadowHalfSize = extent * 1.08;
    // Detail enhance's fine tier renders at half `cellSpacing` — the
    // smallest cube actually on screen, so bias scales off that, not the
    // coarse spacing, whenever it's active (see the constant's comment).
    const finestCellSpacing = config.detailEnhanceEnabled
      ? config.cellSpacing / 2
      : config.cellSpacing;
    const biasScale = finestCellSpacing / SHADOW_BIAS_REFERENCE_CELL_SPACING;
    light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    light.shadow.bias = SHADOW_BIAS * biasScale;
    light.shadow.normalBias = SHADOW_NORMAL_BIAS * biasScale;
    light.shadow.radius = config.shadowSoftness;
    light.shadow.intensity = config.shadowIntensity;
    light.shadow.camera.left = -shadowHalfSize;
    light.shadow.camera.right = shadowHalfSize;
    light.shadow.camera.top = shadowHalfSize;
    light.shadow.camera.bottom = -shadowHalfSize;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = extent * 4.4;
    light.shadow.camera.updateProjectionMatrix();
    light.shadow.needsUpdate = true;
  }, [
    extent,
    config.shadowSoftness,
    config.shadowIntensity,
    config.detailEnhanceEnabled,
    config.cellSpacing,
  ]);

  useEffect(() => {
    if (exposureSnapshotRef.current === null) {
      exposureSnapshotRef.current = gl.toneMappingExposure;
    }
    gl.toneMappingExposure = config.exposure;
  }, [gl, config.exposure]);

  useEffect(
    () => () => {
      if (exposureSnapshotRef.current !== null) {
        gl.toneMappingExposure = exposureSnapshotRef.current;
      }
    },
    [gl]
  );

  return (
    <>
      <primitive object={keyTarget} />
      <primitive object={rimTarget} />
      <primitive object={bounceTarget} />
      <hemisphereLight
        args={[SKY_COLOR, GROUND_COLOR, config.ambientIntensity]}
      />
      <directionalLight
        ref={keyLightRef}
        castShadow
        color={KEY_COLOR}
        intensity={config.keyLightIntensity}
        position={keyPosition}
        target={keyTarget}
      />
      <directionalLight
        color={RIM_COLOR}
        intensity={config.rimLightIntensity}
        position={rimPosition}
        target={rimTarget}
      />
      <directionalLight
        color={BOUNCE_COLOR}
        intensity={config.bounceLightIntensity}
        position={bouncePosition}
        target={bounceTarget}
      />
    </>
  );
}

export default memo(LightRig);
