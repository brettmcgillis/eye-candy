import { button, folder } from 'leva';
import * as THREE from 'three';

import { DEFAULT_SPLINE_CONFIG, updateSplineConfig } from '../splineDefaults';

/**
 * Builds the Leva schema object for one spline's folder contents.
 *
 * @param {number} index — spline index
 * @param {object} cfg   — current splineConfigs[index]
 * @param {object} opts
 *   @param {string}   opts.sceneLabel       — top-level useControls label (e.g. 'Hot Box')
 *   @param {string}   [opts.folderLabel]    — explicit folder label/path segment for this spline instance
 *   @param {Function} opts.setSplineConfigs — state setter for splineConfigs
 *   @param {Function} opts.setSplines       — state setter for splines array
 *   @param {'smoke'|'fire'|'both'} opts.allowedTypes
 *     'smoke' → no type selector, smoke folders only
 *     'fire'  → no type selector, fire folders only
 *     'both'  → full type/smokeType/fireType selectors + all folders
 *
 * Returns the object that goes *inside* a `folder(...)` call.
 */
export default function buildSplineGroupControls(index, cfg, opts) {
  const {
    sceneLabel,
    folderLabel,
    setSplineConfigs,
    setSplines,
    allowedTypes = 'both',
  } = opts;

  // ── Leva render-path helpers ───────────────────────────────────────────────
  // Path format: 'SceneLabel.Folder Name.fieldKey'
  const resolvedFolderLabel = folderLabel ?? `Spline ${index + 1}`;
  const splineFolderPath = `${sceneLabel}.${resolvedFolderLabel}`;
  const getType = (get) => get(`${splineFolderPath}.type_${index}`);
  const getSmokeType = (get) => get(`${splineFolderPath}.smokeType_${index}`);
  const getFireType = (get) => get(`${splineFolderPath}.fireType_${index}`);

  // Always read live Leva store values — never fall back to stale cfg.
  // Sub-type fields (smokeType_N / fireType_N) are always present in the schema
  // for their respective allowedTypes, so get() is safe.
  const isSmoke = (get) => allowedTypes === 'smoke' || getType(get) === 'Smoke';
  const isFire = (get) => allowedTypes === 'fire' || getType(get) === 'Fire';
  const isParticle = (get) => isSmoke(get) && getSmokeType(get) === 'Particle';
  const isVolumetric = (get) =>
    isSmoke(get) && getSmokeType(get) === 'Volumetric';
  const isClassic = (get) => isFire(get) && getFireType(get) === 'Classic';
  const isRayMarch = (get) => isFire(get) && getFireType(get) === 'RayMarch';

  // ── Type selectors (only shown in 'both' mode) ────────────────────────────
  const typeSelectors =
    allowedTypes === 'both'
      ? {
          [`type_${index}`]: {
            label: 'Type',
            value: cfg.type ?? 'Smoke',
            options: ['Smoke', 'Fire'],
            onChange: (v) =>
              updateSplineConfig(setSplineConfigs, index, 'type', v),
          },
          [`smokeType_${index}`]: {
            label: 'Smoke Rendering',
            value: cfg.smokeType ?? 'Particle',
            options: ['Particle', 'Volumetric'],
            render: (get) => getType(get) === 'Smoke',
            onChange: (v) =>
              updateSplineConfig(setSplineConfigs, index, 'smokeType', v),
          },
          [`showSmokeVolume_${index}`]: {
            label: 'Smoke Volume Mesh',
            value: cfg.showSmokeVolume ?? false,
            render: (get) => getType(get) === 'Smoke',
            onChange: (v) =>
              updateSplineConfig(setSplineConfigs, index, 'showSmokeVolume', v),
          },
          [`fireType_${index}`]: {
            label: 'Fire Rendering',
            value: cfg.fireType ?? 'Classic',
            options: ['Classic', 'RayMarch'],
            render: (get) => getType(get) === 'Fire',
            onChange: (v) =>
              updateSplineConfig(setSplineConfigs, index, 'fireType', v),
          },
          [`showFireVolume_${index}`]: {
            label: 'Fire Volume',
            value: cfg.showFireVolume ?? false,
            render: (get) => getType(get) === 'Fire',
            onChange: (v) =>
              updateSplineConfig(setSplineConfigs, index, 'showFireVolume', v),
          },
        }
      : {
          // Single-type modes still expose the sub-type selector
          ...(allowedTypes === 'smoke'
            ? {
                [`smokeType_${index}`]: {
                  label: 'Smoke Rendering',
                  value: cfg.smokeType ?? 'Particle',
                  options: ['Particle', 'Volumetric'],
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'smokeType', v),
                },
                [`showSmokeVolume_${index}`]: {
                  label: 'Volume Mesh',
                  value: cfg.showSmokeVolume ?? false,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'showSmokeVolume',
                      v
                    ),
                },
              }
            : {
                [`fireType_${index}`]: {
                  label: 'Fire Rendering',
                  value: cfg.fireType ?? 'Classic',
                  options: ['Classic', 'RayMarch'],
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'fireType', v),
                },
                [`showFireVolume_${index}`]: {
                  label: 'Fire Volume',
                  value: cfg.showFireVolume ?? false,
                  render: (get) => getFireType(get) === 'Classic',
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'showFireVolume',
                      v
                    ),
                },
              }),
        };

  // ── Smoke folders ─────────────────────────────────────────────────────────
  const smokeFolders =
    allowedTypes !== 'fire'
      ? {
          [`Particle Smoke ${index}`]: folder(
            {
              [`particleCount_${index}`]: {
                label: 'Particle Count',
                value: cfg.particleCount,
                min: 500,
                max: 40000,
                step: 500,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'particleCount',
                    v
                  ),
              },
              [`particleSize_${index}`]: {
                label: 'Particle Size',
                value: cfg.particleSize,
                min: 0.05,
                max: 2,
                step: 0.01,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'particleSize',
                    v
                  ),
              },
              [`particleColor_${index}`]: {
                label: 'Color',
                value: cfg.particleColor,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'particleColor',
                    v
                  ),
              },
              [`opacity_${index}`]: {
                label: 'Opacity',
                value: cfg.opacity,
                min: 0.005,
                max: 1,
                step: 0.005,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'opacity', v),
              },
              [`growth_${index}`]: {
                label: 'Growth',
                value: cfg.growth,
                min: 0,
                max: 10,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'growth', v),
              },
              [`fadeExponent_${index}`]: {
                label: 'Fade Exponent',
                value: cfg.fadeExponent,
                min: 0.1,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'fadeExponent',
                    v
                  ),
              },
              [`buoyancy_${index}`]: {
                label: 'Buoyancy',
                value: cfg.buoyancy,
                min: -2,
                max: 2,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'buoyancy', v),
              },
              [`rotSpeed_${index}`]: {
                label: 'Rotation Speed',
                value: cfg.rotSpeed,
                min: 0,
                max: 5,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'rotSpeed', v),
              },
              [`blendMode_${index}`]: {
                label: 'Blend Mode',
                value: cfg.blendMode,
                options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'blendMode', v),
              },
              [`springK_${index}`]: {
                label: 'Spring Strength',
                value: cfg.springK,
                min: 0,
                max: 40,
                step: 0.5,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'springK', v),
              },
              [`flowSpeed_${index}`]: {
                label: 'Flow Speed',
                value: cfg.flowSpeed,
                min: 0,
                max: 0.5,
                step: 0.005,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'flowSpeed', v),
              },
              [`damping_${index}`]: {
                label: 'Damping /sec',
                value: cfg.damping,
                min: 0.001,
                max: 1,
                step: 0.005,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'damping', v),
              },
              [`turbulence_${index}`]: {
                label: 'Turbulence',
                value: cfg.turbulence,
                min: 0,
                max: 8,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'turbulence', v),
              },
              [`turbulenceSpeed_${index}`]: {
                label: 'Turbulence Speed',
                value: cfg.turbulenceSpeed,
                min: 0,
                max: 3,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'turbulenceSpeed',
                    v
                  ),
              },
              [`spawnSpread_${index}`]: {
                label: 'Spawn Spread',
                value: cfg.spawnSpread,
                min: 0,
                max: 5,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'spawnSpread', v),
              },
              [`maxDrift_${index}`]: {
                label: 'Max Drift',
                value: cfg.maxDrift,
                min: 0.5,
                max: 20,
                step: 0.5,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'maxDrift', v),
              },
              [`fadeRate_${index}`]: {
                label: 'Fade Rate',
                value: cfg.fadeRate,
                min: 1,
                max: 50,
                step: 1,
                hint: 'Open loop only — how fast particles fade after the spline end',
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'fadeRate', v),
              },
            },
            { collapsed: true, render: isParticle }
          ),

          [`Volumetric Smoke ${index}`]: folder(
            {
              [`volParticleCount_${index}`]: {
                label: 'Particle Count',
                value: cfg.volParticleCount,
                min: 500,
                max: 40000,
                step: 500,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'volParticleCount',
                    v
                  ),
              },
              [`volSize_${index}`]: {
                label: 'Particle Size',
                value: cfg.volSize,
                min: 0.05,
                max: 3,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volSize', v),
              },
              [`volColor_${index}`]: {
                label: 'Color',
                value: cfg.volColor,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volColor', v),
              },
              [`volOpacity_${index}`]: {
                label: 'Opacity',
                value: cfg.volOpacity,
                min: 0.005,
                max: 1,
                step: 0.005,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volOpacity', v),
              },
              [`volBlendMode_${index}`]: {
                label: 'Blend Mode',
                value: cfg.volBlendMode,
                options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'volBlendMode',
                    v
                  ),
              },
              [`volSpread_${index}`]: {
                label: 'Spawn Spread',
                value: cfg.volSpread,
                min: 0,
                max: 8,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volSpread', v),
              },
              [`volSpringK_${index}`]: {
                label: 'Spring Strength',
                value: cfg.volSpringK,
                min: 0,
                max: 40,
                step: 0.5,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volSpringK', v),
              },
              [`volDamping_${index}`]: {
                label: 'Damping /sec',
                value: cfg.volDamping,
                min: 0.001,
                max: 1,
                step: 0.005,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volDamping', v),
              },
              [`volTurbulence_${index}`]: {
                label: 'Turbulence',
                value: cfg.volTurbulence,
                min: 0,
                max: 8,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'volTurbulence',
                    v
                  ),
              },
              [`volTurbulenceSpeed_${index}`]: {
                label: 'Turbulence Speed',
                value: cfg.volTurbulenceSpeed,
                min: 0,
                max: 3,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'volTurbulenceSpeed',
                    v
                  ),
              },
              [`volMaxDrift_${index}`]: {
                label: 'Max Drift',
                value: cfg.volMaxDrift,
                min: 0.5,
                max: 20,
                step: 0.5,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volMaxDrift', v),
              },
              [`volGrowth_${index}`]: {
                label: 'Growth',
                value: cfg.volGrowth,
                min: 0,
                max: 10,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volGrowth', v),
              },
              [`volFadeExp_${index}`]: {
                label: 'Fade Exponent',
                value: cfg.volFadeExp,
                min: 0.1,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volFadeExp', v),
              },
              [`volBuoyancy_${index}`]: {
                label: 'Buoyancy',
                value: cfg.volBuoyancy,
                min: -2,
                max: 2,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'volBuoyancy', v),
              },
            },
            { collapsed: true, render: isVolumetric }
          ),
        }
      : {};

  // ── Fire folders ──────────────────────────────────────────────────────────
  const fireFolders =
    allowedTypes !== 'smoke'
      ? {
          [`Volumetric Fire ${index}`]: folder(
            {
              [`fireWidth_${index}`]: {
                label: 'Width',
                value: cfg.fireWidth,
                min: 0.1,
                max: 5,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'fireWidth', v),
              },
              [`fireHeight_${index}`]: {
                label: 'Height',
                value: cfg.fireHeight,
                min: 0.2,
                max: 10,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'fireHeight', v),
              },
              [`fireDepth_${index}`]: {
                label: 'Depth',
                value: cfg.fireDepth,
                min: 0.1,
                max: 5,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'fireDepth', v),
              },
              [`fireSliceSpacing_${index}`]: {
                label: 'Slice Spacing',
                value: cfg.fireSliceSpacing,
                min: 0.005,
                max: 0.2,
                step: 0.005,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'fireSliceSpacing',
                    v
                  ),
              },
              [`fireMagnitude_${index}`]: {
                label: 'Magnitude',
                value: cfg.fireMagnitude,
                min: 0.1,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'fireMagnitude',
                    v
                  ),
              },
              [`fireLacunarity_${index}`]: {
                label: 'Lacunarity',
                value: cfg.fireLacunarity,
                min: 1,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'fireLacunarity',
                    v
                  ),
              },
              [`fireGain_${index}`]: {
                label: 'Gain',
                value: cfg.fireGain,
                min: 0.01,
                max: 1,
                step: 0.01,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'fireGain', v),
              },
              [`fireTintColor_${index}`]: {
                label: 'Tint',
                value: cfg.fireTintColor,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'fireTintColor',
                    v
                  ),
              },
              [`fireSaturation_${index}`]: {
                label: 'Saturation',
                value: cfg.fireSaturation,
                min: 0,
                max: 3,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'fireSaturation',
                    v
                  ),
              },
              [`fireBrightness_${index}`]: {
                label: 'Brightness',
                value: cfg.fireBrightness,
                min: 0,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'fireBrightness',
                    v
                  ),
              },
              [`fireAnimated_${index}`]: {
                label: 'Animated',
                value: cfg.fireAnimated,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'fireAnimated',
                    v
                  ),
              },
              [`fireAnimSpeed_${index}`]: {
                label: 'Anim Speed',
                value: cfg.fireAnimSpeed,
                min: 0,
                max: 3,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'fireAnimSpeed',
                    v
                  ),
              },
            },
            { collapsed: true, render: isClassic }
          ),

          [`RayMarch Fire ${index}`]: folder(
            {
              [`cs184Magnitude_${index}`]: {
                label: 'Magnitude',
                value: cfg.cs184Magnitude,
                min: 0.1,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184Magnitude',
                    v
                  ),
              },
              [`cs184Lacunarity_${index}`]: {
                label: 'Lacunarity',
                value: cfg.cs184Lacunarity,
                min: 1,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184Lacunarity',
                    v
                  ),
              },
              [`cs184Gain_${index}`]: {
                label: 'Gain',
                value: cfg.cs184Gain,
                min: 0.01,
                max: 1,
                step: 0.01,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'cs184Gain', v),
              },
              [`cs184Speed_${index}`]: {
                label: 'Speed',
                value: cfg.cs184Speed,
                min: 0,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'cs184Speed', v),
              },
              [`cs184Density_${index}`]: {
                label: 'Density',
                value: cfg.cs184Density,
                min: 0,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184Density',
                    v
                  ),
              },
              [`cs184Brightness_${index}`]: {
                label: 'Brightness',
                value: cfg.cs184Brightness,
                min: 0,
                max: 5,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184Brightness',
                    v
                  ),
              },
              [`cs184Saturation_${index}`]: {
                label: 'Saturation',
                value: cfg.cs184Saturation,
                min: 0,
                max: 3,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184Saturation',
                    v
                  ),
              },
              [`cs184TintColor_${index}`]: {
                label: 'Tint',
                value: cfg.cs184TintColor,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184TintColor',
                    v
                  ),
              },
              [`cs184CoreColor_${index}`]: {
                label: 'Core Color',
                value: cfg.cs184CoreColor,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184CoreColor',
                    v
                  ),
              },
              [`cs184BorderColor_${index}`]: {
                label: 'Border Color',
                value: cfg.cs184BorderColor,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184BorderColor',
                    v
                  ),
              },
              [`cs184SmokeColor_${index}`]: {
                label: 'Smoke Color',
                value: cfg.cs184SmokeColor,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184SmokeColor',
                    v
                  ),
              },
              [`cs184EmberDensity_${index}`]: {
                label: 'Ember Density',
                value: cfg.cs184EmberDensity,
                min: 0,
                max: 2,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184EmberDensity',
                    v
                  ),
              },
              [`cs184EmberSize_${index}`]: {
                label: 'Ember Size',
                value: cfg.cs184EmberSize,
                min: 0,
                max: 2,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184EmberSize',
                    v
                  ),
              },
              [`cs184EmberColor_${index}`]: {
                label: 'Ember Color',
                value: cfg.cs184EmberColor,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184EmberColor',
                    v
                  ),
              },
              [`cs184Steps_${index}`]: {
                label: 'Steps',
                value: cfg.cs184Steps,
                min: 8,
                max: 128,
                step: 4,
                onChange: (v) =>
                  updateSplineConfig(setSplineConfigs, index, 'cs184Steps', v),
              },
              [`cs184StepSize_${index}`]: {
                label: 'Step Size',
                value: cfg.cs184StepSize,
                min: 0.1,
                max: 3,
                step: 0.1,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184StepSize',
                    v
                  ),
              },
              [`cs184Animated_${index}`]: {
                label: 'Animated',
                value: cfg.cs184Animated,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184Animated',
                    v
                  ),
              },
              [`cs184AnimSpeed_${index}`]: {
                label: 'Anim Speed',
                value: cfg.cs184AnimSpeed,
                min: 0,
                max: 3,
                step: 0.05,
                onChange: (v) =>
                  updateSplineConfig(
                    setSplineConfigs,
                    index,
                    'cs184AnimSpeed',
                    v
                  ),
              },
            },
            { collapsed: true, render: isRayMarch }
          ),
        }
      : {};

  // ── Config + Actions ──────────────────────────────────────────────────────
  const configFolder = {
    [`Config ${index}`]: folder(
      {
        [`name_${index}`]: {
          label: 'Name',
          value: cfg.name ?? '',
          onChange: (v) =>
            updateSplineConfig(setSplineConfigs, index, 'name', v),
        },
        [`visible_${index}`]: {
          label: 'Visible',
          value: cfg.visible,
          onChange: (v) =>
            updateSplineConfig(setSplineConfigs, index, 'visible', v),
        },
        [`tension_${index}`]: {
          label: 'Tension',
          value: cfg.tension,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v) =>
            updateSplineConfig(setSplineConfigs, index, 'tension', v),
        },
        [`closed_${index}`]: {
          label: 'Closed Loop',
          value: cfg.closed,
          onChange: (v) =>
            updateSplineConfig(setSplineConfigs, index, 'closed', v),
        },
        [`showSpline_${index}`]: {
          label: 'Show Spline',
          value: cfg.showSpline,
          onChange: (v) =>
            updateSplineConfig(setSplineConfigs, index, 'showSpline', v),
        },
        [`showHelpers_${index}`]: {
          label: 'Show Helpers',
          value: cfg.showHelpers,
          onChange: (v) =>
            updateSplineConfig(setSplineConfigs, index, 'showHelpers', v),
        },
        [`arcSegments_${index}`]: {
          label: 'Arc Segments',
          value: cfg.arcSegments,
          min: 10,
          max: 500,
          step: 10,
          onChange: (v) =>
            updateSplineConfig(setSplineConfigs, index, 'arcSegments', v),
        },
      },
      { collapsed: true }
    ),
  };

  const actionsFolder = {
    [`Actions ${index}`]: folder(
      {
        [`cloneSpline_${index}`]: button(
          () => {
            setSplines((prev) => {
              const cloned = prev[index].map((pt) => ({
                position: pt.position.clone(),
                rotation: pt.rotation ? pt.rotation.clone() : new THREE.Euler(),
                scale: pt.scale ? pt.scale.clone() : new THREE.Vector3(1, 1, 1),
              }));
              return [...prev, cloned];
            });
            setSplineConfigs((prev) => [
              ...prev,
              {
                ...(prev[index] ?? DEFAULT_SPLINE_CONFIG),
                name: `${(prev[index] ?? DEFAULT_SPLINE_CONFIG).name || `Spline ${index + 1}`} Copy`,
              },
            ]);
          },
          { label: 'Clone Spline' }
        ),
        [`removeSpline_${index}`]: button(
          () => {
            setSplines((prev) =>
              prev.length > 1 ? prev.filter((_el, i) => i !== index) : prev
            );
            setSplineConfigs((prev) =>
              prev.length > 1 ? prev.filter((_el, i) => i !== index) : prev
            );
          },
          { label: 'Remove Spline' }
        ),
        [`addPoint_${index}`]: button(
          () => {
            setSplines((prev) =>
              prev.map((pts, i) => {
                if (i !== index) return pts;
                const lastPos =
                  pts[pts.length - 1]?.position ?? new THREE.Vector3(0, 0, 0);
                return [
                  ...pts,
                  {
                    position: new THREE.Vector3(
                      lastPos.x + (Math.random() - 0.5) * 2,
                      lastPos.y + 0.5 + Math.random() * 1,
                      lastPos.z + (Math.random() - 0.5) * 2
                    ),
                    rotation: new THREE.Euler(),
                    scale: new THREE.Vector3(1, 1, 1),
                  },
                ];
              })
            );
          },
          { label: 'Add Point' }
        ),
        [`removePoint_${index}`]: button(
          () => {
            setSplines((prev) =>
              prev.map((pts, i) => {
                if (i !== index) return pts;
                return pts.length > 2 ? pts.slice(0, -1) : pts;
              })
            );
          },
          { label: 'Remove Last Point' }
        ),
      },
      { collapsed: true }
    ),
  };

  return {
    ...typeSelectors,
    ...smokeFolders,
    ...fireFolders,
    ...configFolder,
    ...actionsFolder,
  };
}
