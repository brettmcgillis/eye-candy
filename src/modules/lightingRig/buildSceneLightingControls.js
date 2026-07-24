import { folder } from 'leva';

import {
  buildLightingControlOverridesFromSnapshot,
  normalizeSceneLightingDeclaration,
  toVectorObject,
} from './sceneLightingUtils';

const DEFAULT_FOLDER_OPTIONS = Object.freeze({ collapsed: true });
const SHADOW_MAP_SIZES = Object.freeze([512, 1024, 2048, 4096]);

function applyControlOverride(controlKey, control, controlOverrides) {
  if (!controlOverrides?.[controlKey]) {
    return control;
  }

  return {
    ...control,
    ...controlOverrides[controlKey],
  };
}

function buildShadowRender(lightingFolderPath, slot) {
  if (!lightingFolderPath) {
    return undefined;
  }

  return (get) =>
    get(`${lightingFolderPath}.${slot.label}.${slot.prefix}CastShadow`);
}

function buildPlacementControls(slot) {
  if (slot.positionMode === 'spherical') {
    return {
      [`${slot.prefix}Azimuth`]: {
        label: 'Azimuth',
        max: 360,
        min: -360,
        step: 1,
        value: slot.spherical.azimuth,
      },
      [`${slot.prefix}Elevation`]: {
        label: 'Elevation',
        max: 90,
        min: -90,
        step: 1,
        value: slot.spherical.elevation,
      },
      [`${slot.prefix}Radius`]: {
        label: 'Radius',
        max: 200,
        min: 0.1,
        step: 0.1,
        value: slot.spherical.radius,
      },
    };
  }

  return {
    [`${slot.prefix}Position`]: {
      label: 'Position',
      step: 0.1,
      value: toVectorObject(slot.position, slot.position),
    },
  };
}

function buildShadowControls(slot, lightingFolderPath) {
  if (!slot.shadow) {
    return {};
  }

  const render = buildShadowRender(lightingFolderPath, slot);

  return {
    [`${slot.prefix}CastShadow`]: { label: 'Cast Shadow', value: true },
    [`${slot.prefix}ShadowMapSize`]: {
      label: 'Shadow Map',
      options: SHADOW_MAP_SIZES,
      render,
      value: slot.shadow.mapSize,
    },
    [`${slot.prefix}ShadowBias`]: {
      label: 'Shadow Bias',
      max: 0.01,
      min: -0.01,
      render,
      step: 0.0001,
      value: slot.shadow.bias,
    },
    [`${slot.prefix}ShadowNormalBias`]: {
      label: 'Shadow Normal Bias',
      max: 0.5,
      min: 0,
      render,
      step: 0.005,
      value: slot.shadow.normalBias,
    },
    [`${slot.prefix}ShadowFar`]: {
      label: 'Shadow Far',
      max: 500,
      min: 1,
      render,
      step: 0.5,
      value: slot.shadow.far,
    },
    ...(slot.type === 'directional'
      ? {
          [`${slot.prefix}ShadowExtent`]: {
            label: 'Shadow Extent',
            max: 200,
            min: 1,
            render,
            step: 0.5,
            value: slot.shadow.extent,
          },
        }
      : {}),
  };
}

function buildColorControls(slot) {
  if (slot.type === 'hemisphere') {
    return {
      [`${slot.prefix}SkyColor`]: { label: 'Sky Color', value: slot.skyColor },
      [`${slot.prefix}GroundColor`]: {
        label: 'Ground Color',
        value: slot.groundColor,
      },
    };
  }

  return {
    [`${slot.prefix}Color`]: { label: 'Color', value: slot.color },
  };
}

function buildFalloffControls(slot) {
  if (slot.type !== 'point' && slot.type !== 'spot') {
    return {};
  }

  return {
    [`${slot.prefix}Distance`]: {
      label: 'Distance',
      max: 200,
      min: 0,
      step: 0.5,
      value: slot.distance,
    },
    [`${slot.prefix}Decay`]: {
      label: 'Decay',
      max: 4,
      min: 0,
      step: 0.1,
      value: slot.decay,
    },
  };
}

function buildConeControls(slot) {
  if (slot.type !== 'spot') {
    return {};
  }

  return {
    [`${slot.prefix}Angle`]: {
      label: 'Angle',
      max: 90,
      min: 1,
      step: 1,
      value: slot.angle,
    },
    [`${slot.prefix}Penumbra`]: {
      label: 'Penumbra',
      max: 1,
      min: 0,
      step: 0.01,
      value: slot.penumbra,
    },
  };
}

function buildAreaControls(slot) {
  if (slot.type !== 'rectArea') {
    return {};
  }

  return {
    [`${slot.prefix}Width`]: {
      label: 'Width',
      max: 50,
      min: 0.1,
      step: 0.1,
      value: slot.width,
    },
    [`${slot.prefix}Height`]: {
      label: 'Height',
      max: 50,
      min: 0.1,
      step: 0.1,
      value: slot.height,
    },
    [`${slot.prefix}Rotation`]: {
      label: 'Rotation',
      step: 0.05,
      value: toVectorObject(slot.rotation, slot.rotation),
    },
  };
}

function buildSlotControls(slot, lightingFolderPath, controlOverrides) {
  const hasPlacement = slot.type !== 'ambient' && slot.type !== 'hemisphere';
  // Derive the slider ceiling from the value the control will actually open
  // with — a preset brighter than the declaration would otherwise be clamped
  // to the declaration's range the moment Leva applies it.
  const seededIntensity =
    controlOverrides?.[`${slot.prefix}Intensity`]?.value ?? slot.intensity;
  const controls = {
    [`${slot.prefix}Enabled`]: { label: 'Enabled', value: slot.enabled },
    ...buildColorControls(slot),
    [`${slot.prefix}Intensity`]: {
      label: 'Intensity',
      max: Math.max(seededIntensity * 4, slot.intensity * 4, 10),
      min: 0,
      step: 0.01,
      value: slot.intensity,
    },
    ...(hasPlacement ? buildPlacementControls(slot) : {}),
    ...(slot.target
      ? {
          [`${slot.prefix}Target`]: {
            label: 'Target',
            step: 0.1,
            value: toVectorObject(slot.target, slot.target),
          },
        }
      : {}),
    ...buildConeControls(slot),
    ...buildFalloffControls(slot),
    ...buildAreaControls(slot),
    ...buildShadowControls(slot, lightingFolderPath),
    ...(hasPlacement
      ? { [`${slot.prefix}Debug`]: { label: 'Debug', value: slot.debug } }
      : {}),
  };

  return Object.fromEntries(
    Object.entries(controls).map(([controlKey, control]) => [
      controlKey,
      applyControlOverride(controlKey, control, controlOverrides),
    ])
  );
}

export default function buildSceneLightingControls({
  controlOverrides: explicitControlOverrides = null,
  controlsSnapshotRef = null,
  lighting = null,
  lightingFolderPath = null,
} = {}) {
  const normalized = normalizeSceneLightingDeclaration(lighting);
  // Seed the schema's `value:`s from the active preset (via controlsSnapshotRef,
  // already populated by usePresetsFolder) before falling back to the static
  // slot declaration — same reason the camera builder does it.
  const controlOverrides = {
    ...buildLightingControlOverridesFromSnapshot(controlsSnapshotRef?.current),
    ...(explicitControlOverrides ?? {}),
  };

  return {
    lightEnabled: applyControlOverride(
      'lightEnabled',
      { label: 'Lighting Enabled', value: normalized.enabled },
      controlOverrides
    ),
    ...normalized.slots.reduce((accumulator, slot) => {
      return {
        ...accumulator,
        [slot.label]: folder(
          buildSlotControls(slot, lightingFolderPath, controlOverrides),
          DEFAULT_FOLDER_OPTIONS
        ),
      };
    }, {}),
  };
}
