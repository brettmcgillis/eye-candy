import * as THREE from 'three';

function toLayerTint(colorValue, alphaValue) {
  const color = new THREE.Color(colorValue);

  return [color.r, color.g, color.b, alphaValue];
}

function resolvePatchColors(controls, variant) {
  if (variant === 'shell') {
    return {
      colorDark: controls.grassShellDarkColor,
      colorLight: controls.grassShellLightColor,
    };
  }

  if (variant === 'strand') {
    return {
      colorDark: controls.grassStrandDarkColor,
      colorLight: controls.grassStrandLightColor,
    };
  }

  if (variant === 'combo') {
    return {
      colorDark: new THREE.Color(controls.grassShellDarkColor).lerp(
        new THREE.Color(controls.grassStrandDarkColor),
        0.5
      ),
      colorLight: new THREE.Color(controls.grassShellLightColor).lerp(
        new THREE.Color(controls.grassStrandLightColor),
        0.5
      ),
    };
  }

  return {
    colorDark: controls.grassPlainDarkColor,
    colorLight: controls.grassPlainLightColor,
  };
}

export function createShellProps(controls) {
  return {
    alphaTexturePath: controls.shellAlphaTexturePath,
    endColor: toLayerTint(controls.shellEndColor, controls.shellEndAlpha),
    interactionRadius: controls.shellInteractionRadius,
    interactionStrength: controls.shellInteractionStrength,
    interactive: controls.shellInteractive,
    layers: controls.shellLayers,
    showInteractionSurface: controls.shellShowInteractionSurface,
    startColor: toLayerTint(controls.shellStartColor, controls.shellStartAlpha),
    stiffness: controls.shellStiffness,
    thickness: controls.shellThickness,
    waveScale: controls.shellWaveScale,
  };
}

export function createStrandProps(controls) {
  return {
    alphaTexturePath: controls.strandAlphaTexturePath,
    bladeHeight: controls.strandBladeHeight,
    bladeWidth: controls.strandBladeWidth,
    count: controls.strandCount,
    curvature: controls.strandCurvature,
    interactionRadius: controls.strandInteractionRadius,
    interactionStrength: controls.strandInteractionStrength,
    interactive: controls.strandInteractive,
    noiseAmplitude: controls.strandNoiseAmplitude,
    noiseFrequency: controls.strandNoiseFrequency,
    rootColor: controls.strandUseRootColor ? controls.strandRootColor : null,
    showInteractionSurface: controls.strandShowInteractionSurface,
    tipColor: controls.strandUseTipColor ? controls.strandTipColor : null,
    tipMix: controls.strandTipMix,
    waveAmplitude: controls.strandWaveAmplitude,
    waveDirection: [
      controls.strandWaveDirectionX,
      controls.strandWaveDirectionY,
    ],
    waveLength: controls.strandWaveLength,
    waveSpeed: controls.strandWaveSpeed,
    windStrength: controls.strandWindStrength,
  };
}

export function createPatchProps(controls, variant = 'plain') {
  return {
    ...resolvePatchColors(controls, variant),
    contactOffset: controls.grassRabbitContactOffset,
    height: controls.grassDomeHeight,
    radius: controls.grassDomeRadius,
  };
}

export function createShellPatchProps(controls) {
  return {
    alphaTexturePath: controls.grassShellAlphaTexturePath,
    endColor: toLayerTint(controls.grassShellTipColor, 0),
    interactionRadius: controls.grassShellInteractionRadius,
    interactionStrength: controls.grassShellInteractionStrength,
    interactive: controls.shellInteractive,
    layers: controls.grassShellLayers,
    showInteractionSurface: controls.shellShowInteractionSurface,
    startColor: toLayerTint(controls.grassShellRootColor, 1),
    stiffness: controls.grassShellStiffness,
    thickness: controls.grassShellThickness,
    waveScale: controls.grassShellWaveScale,
  };
}

export function createStrandPatchProps(controls) {
  return {
    alphaTexturePath: controls.grassStrandAlphaTexturePath,
    bladeHeight: controls.grassStrandBladeHeight,
    bladeWidth: controls.grassStrandBladeWidth,
    count: controls.grassStrandCount,
    curvature: controls.grassStrandCurvature,
    interactionRadius: controls.grassStrandInteractionRadius,
    interactionStrength: controls.grassStrandInteractionStrength,
    interactive: controls.strandInteractive,
    noiseAmplitude: controls.grassStrandNoiseAmplitude,
    noiseFrequency: controls.grassStrandNoiseFrequency,
    rootColor: controls.grassStrandRootColor,
    showInteractionSurface: controls.strandShowInteractionSurface,
    tipColor: controls.grassStrandTipColor,
    tipMix: controls.grassStrandTipMix,
    waveAmplitude: controls.grassStrandWaveAmplitude,
    waveDirection: [
      controls.grassStrandWaveDirectionX,
      controls.grassStrandWaveDirectionY,
    ],
    waveLength: controls.grassStrandWaveLength,
    waveSpeed: controls.grassStrandWaveSpeed,
    windStrength: controls.grassStrandWindStrength,
  };
}
