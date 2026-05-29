import * as THREE from 'three';

import {
  DEFAULT_ARC_PROPS,
  WATER_HEIGHT,
  WATER_WAVE_CHOPPINESS,
  WATER_WAVE_HEIGHT,
  WATER_WAVE_SPEED,
} from './config';

function readArcControl(controls, controlKey, defaultKey) {
  return controls?.[controlKey] ?? DEFAULT_ARC_PROPS[defaultKey];
}

export function resolveWorldPosition(ref, fallback) {
  const fallbackPoint = new THREE.Vector3(...fallback);

  return () =>
    ref.current?.getWorldPosition(new THREE.Vector3()) || fallbackPoint.clone();
}

export function createWaterTargetResolver(waterGroupRef, waterInteraction) {
  return () => {
    const localPoint = new THREE.Vector3(
      0,
      WATER_HEIGHT / 2 +
        waterInteraction.sampleHeight(
          0,
          0,
          WATER_WAVE_HEIGHT,
          WATER_WAVE_CHOPPINESS,
          WATER_WAVE_SPEED
        ),
      0
    );

    return waterGroupRef.current
      ? waterGroupRef.current.localToWorld(localPoint)
      : localPoint;
  };
}

export function createWaterNormalResolver(waterGroupRef, waterInteraction) {
  return () => {
    const localNormal = waterInteraction.sampleNormal(
      0,
      0,
      WATER_WAVE_HEIGHT,
      WATER_WAVE_CHOPPINESS,
      WATER_WAVE_SPEED,
      new THREE.Vector3()
    );

    return waterGroupRef.current
      ? localNormal.transformDirection(waterGroupRef.current.matrixWorld)
      : localNormal;
  };
}

export function getAutoRandomInterval(controls) {
  return [
    Math.min(controls.autoRandomMinInterval, controls.autoRandomMaxInterval),
    Math.max(controls.autoRandomMinInterval, controls.autoRandomMaxInterval),
  ];
}

export function getCameraPosition(controls) {
  return [controls.cameraX, controls.cameraY, controls.cameraZ];
}

export function getCameraTarget(controls) {
  return [
    controls.cameraTargetX,
    controls.cameraTargetY,
    controls.cameraTargetZ,
  ];
}

export function getDefaultSource(controls) {
  if (!controls.useDefaultSource) {
    return null;
  }

  return new THREE.Vector3(
    controls.defaultSourceX,
    controls.defaultSourceY,
    controls.defaultSourceZ
  );
}

export function getKeyboardShortcuts(controls) {
  return {
    clear: controls.clearKey,
    preset: controls.presetKey,
    random: controls.randomKey,
  };
}

export function getLightningEffects(controls) {
  return {
    cameraShake: {
      decay: controls.cameraShakeDecay,
      enabled: controls.cameraShakeEnabled,
      frequency: controls.cameraShakeFrequency,
      intensity: controls.cameraShakeIntensity,
    },
    cracks: {
      countMax: Math.max(controls.cracksCountMin, controls.cracksCountMax),
      countMin: Math.min(controls.cracksCountMin, controls.cracksCountMax),
      enabled: controls.cracksEnabled,
      lengthScale: controls.cracksLengthScale,
    },
    debris: {
      countMax: Math.max(controls.debrisCountMin, controls.debrisCountMax),
      countMin: Math.min(controls.debrisCountMin, controls.debrisCountMax),
      enabled: controls.debrisEnabled,
    },
    groundFlash: {
      enabled: controls.groundFlashEnabled,
      intensity: controls.groundFlashIntensity,
      size: controls.groundFlashSize,
    },
    overlay: {
      decay: controls.overlayDecay,
      enabled: controls.overlayEnabled,
      maxAlpha: controls.overlayMaxAlpha,
    },
    pointLight: {
      enabled: controls.pointLightEnabled,
      intensity: controls.pointLightIntensity,
      radius: controls.pointLightRadius,
    },
    shockwave: {
      alphaMultiplier: controls.shockwaveAlpha,
      enabled: controls.shockwaveEnabled,
      size: controls.shockwaveSize,
    },
    sparks: {
      countMax: Math.max(controls.sparksCountMin, controls.sparksCountMax),
      countMin: Math.min(controls.sparksCountMin, controls.sparksCountMax),
      enabled: controls.sparksEnabled,
      gravity: controls.sparksGravity,
      size: controls.sparksSize,
    },
  };
}

export function getPresetTargets(controls) {
  return [
    { target: [controls.preset1X, controls.preset1Y, controls.preset1Z] },
    { target: [controls.preset2X, controls.preset2Y, controls.preset2Z] },
    { target: [controls.preset3X, controls.preset3Y, controls.preset3Z] },
  ];
}

export function getRandomStrikeBounds(controls) {
  const minHeight = Math.min(
    controls.randomMinHeight,
    controls.randomMaxHeight
  );
  const maxHeight = Math.max(
    controls.randomMinHeight,
    controls.randomMaxHeight
  );
  const bounds = {
    avoidCameraRadius: controls.randomAvoidCameraRadius,
    maxAttempts: controls.randomMaxAttempts,
    maxHeight,
    minHeight,
    targetY: controls.groundPlaneY,
  };

  if (controls.randomMode === 'radial') {
    bounds.centerX = controls.randomCenterX;
    bounds.centerZ = controls.randomCenterZ;
    bounds.radialMin = Math.min(
      controls.randomRadialMin,
      controls.randomRadialMax
    );
    bounds.radialMax = Math.max(
      controls.randomRadialMin,
      controls.randomRadialMax
    );
  } else {
    bounds.minX = Math.min(controls.randomMinX, controls.randomMaxX);
    bounds.maxX = Math.max(controls.randomMinX, controls.randomMaxX);
    bounds.minZ = Math.min(controls.randomMinZ, controls.randomMaxZ);
    bounds.maxZ = Math.max(controls.randomMinZ, controls.randomMaxZ);
  }

  if (controls.randomUseTopJitter) {
    bounds.topJitter = controls.randomTopJitter;
  } else {
    bounds.sourceSpread = controls.randomSourceSpread;
  }

  return bounds;
}

export function getArcStrandOptions(controls) {
  const branchLengthFactorMin = Math.min(
    readArcControl(
      controls,
      'arcBranchLengthFactorMin',
      'branchLengthFactorMin'
    ),
    readArcControl(
      controls,
      'arcBranchLengthFactorMax',
      'branchLengthFactorMax'
    )
  );
  const branchLengthFactorMax = Math.max(
    readArcControl(
      controls,
      'arcBranchLengthFactorMin',
      'branchLengthFactorMin'
    ),
    readArcControl(
      controls,
      'arcBranchLengthFactorMax',
      'branchLengthFactorMax'
    )
  );

  return {
    branchCount: readArcControl(controls, 'arcBranchCount', 'branchCount'),
    branchLengthFactorMax,
    branchLengthFactorMin,
    branchMode: 'arc',
    branchRadiusScale: readArcControl(
      controls,
      'arcBranchRadiusScale',
      'branchRadiusScale'
    ),
    mainFractalDepth: readArcControl(
      controls,
      'arcMainFractalDepth',
      'mainFractalDepth'
    ),
    mainRadiusScale: readArcControl(
      controls,
      'arcMainRadiusScale',
      'mainRadiusScale'
    ),
    roughness: readArcControl(controls, 'arcRoughness', 'roughness'),
  };
}
