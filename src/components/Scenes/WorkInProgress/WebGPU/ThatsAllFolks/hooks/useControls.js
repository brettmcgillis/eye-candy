import { folder, useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { LEGACY_WORLD_TO_SCENE } from '../../../../../../presets/smoke/thatsAllFolksSmoke';
import { DEFAULT_PRESET, PRESETS } from '../presets/presets';

const C = { collapsed: true };

const s = (value) => Number((value * LEGACY_WORLD_TO_SCENE).toFixed(3));

function curveDef(defaults = {}) {
  const {
    visible = true,
    particleCount = 3000,
    particleSize = s(22),
    opacity = 0.036,
    flowSpeed = 0.022,
  } = defaults;

  return {
    visible: { label: 'Visible', value: visible },
    particleCount: {
      label: 'Particles',
      value: particleCount,
      min: 100,
      max: 150000,
      step: 100,
    },
    particleSize: {
      label: 'Size',
      value: particleSize,
      min: s(5),
      max: s(100),
      step: s(1),
    },
    opacity: {
      label: 'Opacity',
      value: opacity,
      min: 0.005,
      max: 0.5,
      step: 0.005,
    },
    flowSpeed: {
      label: 'Flow Speed',
      value: flowSpeed,
      min: 0,
      max: 0.3,
      step: 0.002,
    },
  };
}

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

function buildCurves(controls) {
  return {
    capitalT: {
      visible: controls.capitalTVisible,
      particleCount: controls.capitalTParticleCount,
      particleSize: controls.capitalTParticleSize,
      opacity: controls.capitalTOpacity,
      flowSpeed: controls.capitalTFlowSpeed,
    },
    hats: {
      visible: controls.hatsVisible,
      particleCount: controls.hatsParticleCount,
      particleSize: controls.hatsParticleSize,
      opacity: controls.hatsOpacity,
      flowSpeed: controls.hatsFlowSpeed,
    },
    crossbar: {
      visible: controls.crossbarVisible,
      particleCount: controls.crossbarParticleCount,
      particleSize: controls.crossbarParticleSize,
      opacity: controls.crossbarOpacity,
      flowSpeed: controls.crossbarFlowSpeed,
    },
    apostrophe: {
      visible: controls.apostropheVisible,
      particleCount: controls.apostropheParticleCount,
      particleSize: controls.apostropheParticleSize,
      opacity: controls.apostropheOpacity,
      flowSpeed: controls.apostropheFlowSpeed,
    },
    allLetters: {
      visible: controls.allLettersVisible,
      particleCount: controls.allLettersParticleCount,
      particleSize: controls.allLettersParticleSize,
      opacity: controls.allLettersOpacity,
      flowSpeed: controls.allLettersFlowSpeed,
    },
    capitalF: {
      visible: controls.capitalFVisible,
      particleCount: controls.capitalFParticleCount,
      particleSize: controls.capitalFParticleSize,
      opacity: controls.capitalFOpacity,
      flowSpeed: controls.capitalFFlowSpeed,
    },
    exclamLine: {
      visible: controls.exclamLineVisible,
      particleCount: controls.exclamLineParticleCount,
      particleSize: controls.exclamLineParticleSize,
      opacity: controls.exclamLineOpacity,
      flowSpeed: controls.exclamLineFlowSpeed,
    },
    exclamDot: {
      visible: controls.exclamDotVisible,
      particleCount: controls.exclamDotParticleCount,
      particleSize: controls.exclamDotParticleSize,
      opacity: controls.exclamDotOpacity,
      flowSpeed: controls.exclamDotFlowSpeed,
    },
    olksTail: {
      visible: controls.olksTailVisible,
      particleCount: controls.olksTailParticleCount,
      particleSize: controls.olksTailParticleSize,
      opacity: controls.olksTailOpacity,
      flowSpeed: controls.olksTailFlowSpeed,
    },
  };
}

export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [controls, setControls] = useControls(
    'Thats All Folks',
    () => ({
      Presets: presetsFolder,

      Scene: folder(
        {
          bgColor: { label: 'Background', value: p.bgColor },
          Visibility: folder(
            {
              showSmoke: {
                label: 'Show Smoke',
                value: p.showSmoke,
              },
              showBangFlag: {
                label: 'Show Bang Rig',
                value: p.showBangFlag,
              },
            },
            C
          ),
          Bloom: folder(
            {
              bloomIntensity: {
                label: 'Intensity',
                value: p.bloomIntensity,
                min: 0,
                max: 5,
                step: 0.05,
              },
              bloomThreshold: {
                label: 'Threshold',
                value: p.bloomThreshold,
                min: 0,
                max: 1,
                step: 0.01,
              },
              bloomSmoothing: {
                label: 'Smoothing',
                value: p.bloomSmoothing,
                min: 0,
                max: 1,
                step: 0.01,
              },
            },
            C
          ),
          Lighting: folder(
            {
              Ambient: folder(
                {
                  ambientIntensity: {
                    label: 'Intensity',
                    value: p.ambientIntensity,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                  ambientColor: {
                    label: 'Color',
                    value: p.ambientColor,
                  },
                },
                C
              ),
              Spot: folder(
                {
                  spotIntensity: {
                    label: 'Intensity',
                    value: p.spotIntensity,
                    min: 0,
                    max: 200,
                    step: 1,
                  },
                  spotColor: {
                    label: 'Color',
                    value: p.spotColor,
                  },
                  spotDecay: {
                    label: 'Decay',
                    value: p.spotDecay,
                    min: 0,
                    max: 4,
                    step: 0.1,
                  },
                  spotX: {
                    label: 'X',
                    value: p.spotX,
                    min: s(-2000),
                    max: s(2000),
                    step: s(10),
                  },
                  spotY: {
                    label: 'Y',
                    value: p.spotY,
                    min: s(-2000),
                    max: s(3000),
                    step: s(10),
                  },
                  spotZ: {
                    label: 'Z',
                    value: p.spotZ,
                    min: s(-2000),
                    max: s(2000),
                    step: s(10),
                  },
                },
                C
              ),
            },
            C
          ),
        },
        C
      ),

      Gun: folder(
        {
          gunScale: {
            label: 'Scale',
            value: p.gunScale,
            min: s(50),
            max: s(2000),
            step: s(10),
          },
          gunX: {
            label: 'X',
            value: p.gunX,
            min: s(-800),
            max: s(800),
            step: s(5),
          },
          gunY: {
            label: 'Y',
            value: p.gunY,
            min: s(-400),
            max: s(600),
            step: s(5),
          },
          gunZ: {
            label: 'Z',
            value: p.gunZ,
            min: s(-800),
            max: s(800),
            step: s(5),
          },
        },
        C
      ),

      Smoke: folder(
        {
          smokeType: {
            label: 'Smoke Type',
            value: p.smokeType,
            options: ['particle', 'volumetric', 'both'],
          },
          blendMode: {
            label: 'Blend Mode',
            value: p.blendMode,
            options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
          },
          particleColor: {
            label: 'Color',
            value: p.particleColor,
          },
          smokeScale: {
            label: 'Scale',
            value: p.smokeScale,
            min: 0.1,
            max: 4,
            step: 0.05,
          },
          smokeX: {
            label: 'X',
            value: p.smokeX,
            min: s(-800),
            max: s(800),
            step: s(5),
          },
          smokeY: {
            label: 'Y',
            value: p.smokeY,
            min: s(-400),
            max: s(800),
            step: s(5),
          },
          smokeZ: {
            label: 'Z',
            value: p.smokeZ,
            min: s(-800),
            max: s(800),
            step: s(5),
          },
          showHelpers: {
            label: 'Show Helpers',
            value: p.showHelpers,
          },
          Interaction: folder(
            {
              cursorAttractorEnabled: {
                label: 'Enabled',
                value: p.cursorAttractorEnabled,
              },
              showCursorAttractor: {
                label: 'Show Cursor',
                value: p.showCursorAttractor,
              },
              cursorAttractorMode: {
                label: 'Mode',
                value: p.cursorAttractorMode,
                options: ['attractor', 'repeller'],
              },
              cursorAttractorStrength: {
                label: 'Strength',
                value: p.cursorAttractorStrength,
                min: 0,
                max: 20,
                step: 0.1,
              },
              cursorAttractorRadius: {
                label: 'Radius',
                value: p.cursorAttractorRadius,
                min: s(10),
                max: s(1000),
                step: s(5),
              },
            },
            C
          ),
          'Particle Physics': folder(
            {
              springK: {
                label: 'Spring',
                value: p.springK,
                min: 0,
                max: 40,
                step: 0.5,
              },
              damping: {
                label: 'Damping',
                value: p.damping,
                min: 0.001,
                max: 1,
                step: 0.005,
              },
              turbulence: {
                label: 'Turbulence',
                value: p.turbulence,
                min: 0,
                max: s(600),
                step: s(5),
              },
              turbulenceSpeed: {
                label: 'Turb Speed',
                value: p.turbulenceSpeed,
                min: 0,
                max: 3,
                step: 0.05,
              },
              spawnSpread: {
                label: 'Spawn Spread',
                value: p.spawnSpread,
                min: 0,
                max: s(400),
                step: s(5),
              },
              maxDrift: {
                label: 'Max Drift',
                value: p.maxDrift,
                min: s(50),
                max: s(2000),
                step: s(50),
              },
              fadeRate: {
                label: 'Fade Rate',
                value: p.fadeRate,
                min: 1,
                max: 30,
                step: 1,
              },
              growth: {
                label: 'Size Growth',
                value: p.growth,
                min: 0,
                max: 8,
                step: 0.1,
              },
              fadeExponent: {
                label: 'Age Fade',
                value: p.fadeExponent,
                min: 0.3,
                max: 5,
                step: 0.1,
              },
              buoyancy: {
                label: 'Buoyancy',
                value: p.buoyancy,
                min: 0,
                max: s(200),
                step: s(5),
              },
              rotSpeed: {
                label: 'Rot Speed',
                value: p.rotSpeed,
                min: 0,
                max: 2,
                step: 0.05,
              },
            },
            C
          ),
          'Volumetric Physics': folder(
            {
              volSpringK: {
                label: 'Spring',
                value: p.volSpringK,
                min: 0,
                max: 40,
                step: 0.5,
              },
              volDamping: {
                label: 'Damping',
                value: p.volDamping,
                min: 0.001,
                max: 1,
                step: 0.005,
              },
              volTurbulence: {
                label: 'Turbulence',
                value: p.volTurbulence,
                min: 0,
                max: s(800),
                step: s(10),
              },
              volTurbulenceSpeed: {
                label: 'Turb Speed',
                value: p.volTurbulenceSpeed,
                min: 0,
                max: 3,
                step: 0.05,
              },
              volSpread: {
                label: 'Spawn Spread',
                value: p.volSpread,
                min: 0,
                max: s(600),
                step: s(5),
              },
              volMaxDrift: {
                label: 'Max Drift',
                value: p.volMaxDrift,
                min: s(50),
                max: s(2000),
                step: s(50),
              },
              volFadeRate: {
                label: 'Fade Rate',
                value: p.volFadeRate,
                min: 1,
                max: 30,
                step: 1,
              },
            },
            C
          ),
          Groups: folder(
            {
              "That's": folder(
                {
                  thatsX: {
                    label: 'X',
                    value: p.thatsX,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                  thatsY: {
                    label: 'Y',
                    value: p.thatsY,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                  thatsZ: {
                    label: 'Z',
                    value: p.thatsZ,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                },
                C
              ),
              All: folder(
                {
                  allX: {
                    label: 'X',
                    value: p.allX,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                  allY: {
                    label: 'Y',
                    value: p.allY,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                  allZ: {
                    label: 'Z',
                    value: p.allZ,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                },
                C
              ),
              Folks: folder(
                {
                  folksX: {
                    label: 'X',
                    value: p.folksX,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                  folksY: {
                    label: 'Y',
                    value: p.folksY,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                  folksZ: {
                    label: 'Z',
                    value: p.folksZ,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                },
                C
              ),
              Exclamation: folder(
                {
                  exclamX: {
                    label: 'X',
                    value: p.exclamX,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                  exclamY: {
                    label: 'Y',
                    value: p.exclamY,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                  exclamZ: {
                    label: 'Z',
                    value: p.exclamZ,
                    min: s(-500),
                    max: s(500),
                    step: s(1),
                  },
                },
                C
              ),
            },
            C
          ),
          Splines: folder(
            {
              'Capital T': folder(
                {
                  capitalTVisible: curveDef({ visible: p.capitalTVisible })
                    .visible,
                  capitalTParticleCount: curveDef({
                    particleCount: p.capitalTParticleCount,
                  }).particleCount,
                  capitalTParticleSize: curveDef({
                    particleSize: p.capitalTParticleSize,
                  }).particleSize,
                  capitalTOpacity: curveDef({ opacity: p.capitalTOpacity })
                    .opacity,
                  capitalTFlowSpeed: curveDef({
                    flowSpeed: p.capitalTFlowSpeed,
                  }).flowSpeed,
                },
                C
              ),
              'hats (h,a,t,s)': folder(
                {
                  hatsVisible: curveDef({ visible: p.hatsVisible }).visible,
                  hatsParticleCount: curveDef({
                    particleCount: p.hatsParticleCount,
                  }).particleCount,
                  hatsParticleSize: curveDef({
                    particleSize: p.hatsParticleSize,
                  }).particleSize,
                  hatsOpacity: curveDef({ opacity: p.hatsOpacity }).opacity,
                  hatsFlowSpeed: curveDef({ flowSpeed: p.hatsFlowSpeed })
                    .flowSpeed,
                },
                C
              ),
              'T Crossbar': folder(
                {
                  crossbarVisible: curveDef({ visible: p.crossbarVisible })
                    .visible,
                  crossbarParticleCount: curveDef({
                    particleCount: p.crossbarParticleCount,
                  }).particleCount,
                  crossbarParticleSize: curveDef({
                    particleSize: p.crossbarParticleSize,
                  }).particleSize,
                  crossbarOpacity: curveDef({ opacity: p.crossbarOpacity })
                    .opacity,
                  crossbarFlowSpeed: curveDef({
                    flowSpeed: p.crossbarFlowSpeed,
                  }).flowSpeed,
                },
                C
              ),
              Apostrophe: folder(
                {
                  apostropheVisible: curveDef({ visible: p.apostropheVisible })
                    .visible,
                  apostropheParticleCount: curveDef({
                    particleCount: p.apostropheParticleCount,
                  }).particleCount,
                  apostropheParticleSize: curveDef({
                    particleSize: p.apostropheParticleSize,
                  }).particleSize,
                  apostropheOpacity: curveDef({ opacity: p.apostropheOpacity })
                    .opacity,
                  apostropheFlowSpeed: curveDef({
                    flowSpeed: p.apostropheFlowSpeed,
                  }).flowSpeed,
                },
                C
              ),
              All: folder(
                {
                  allLettersVisible: curveDef({ visible: p.allLettersVisible })
                    .visible,
                  allLettersParticleCount: curveDef({
                    particleCount: p.allLettersParticleCount,
                  }).particleCount,
                  allLettersParticleSize: curveDef({
                    particleSize: p.allLettersParticleSize,
                  }).particleSize,
                  allLettersOpacity: curveDef({ opacity: p.allLettersOpacity })
                    .opacity,
                  allLettersFlowSpeed: curveDef({
                    flowSpeed: p.allLettersFlowSpeed,
                  }).flowSpeed,
                },
                C
              ),
              'Capital F': folder(
                {
                  capitalFVisible: curveDef({ visible: p.capitalFVisible })
                    .visible,
                  capitalFParticleCount: curveDef({
                    particleCount: p.capitalFParticleCount,
                  }).particleCount,
                  capitalFParticleSize: curveDef({
                    particleSize: p.capitalFParticleSize,
                  }).particleSize,
                  capitalFOpacity: curveDef({ opacity: p.capitalFOpacity })
                    .opacity,
                  capitalFFlowSpeed: curveDef({
                    flowSpeed: p.capitalFFlowSpeed,
                  }).flowSpeed,
                },
                C
              ),
              'Exclamation !': folder(
                {
                  exclamLineVisible: curveDef({ visible: p.exclamLineVisible })
                    .visible,
                  exclamLineParticleCount: curveDef({
                    particleCount: p.exclamLineParticleCount,
                  }).particleCount,
                  exclamLineParticleSize: curveDef({
                    particleSize: p.exclamLineParticleSize,
                  }).particleSize,
                  exclamLineOpacity: curveDef({ opacity: p.exclamLineOpacity })
                    .opacity,
                  exclamLineFlowSpeed: curveDef({
                    flowSpeed: p.exclamLineFlowSpeed,
                  }).flowSpeed,
                },
                C
              ),
              'Exclamation Dot': folder(
                {
                  exclamDotVisible: curveDef({ visible: p.exclamDotVisible })
                    .visible,
                  exclamDotParticleCount: curveDef({
                    particleCount: p.exclamDotParticleCount,
                  }).particleCount,
                  exclamDotParticleSize: curveDef({
                    particleSize: p.exclamDotParticleSize,
                  }).particleSize,
                  exclamDotOpacity: curveDef({ opacity: p.exclamDotOpacity })
                    .opacity,
                  exclamDotFlowSpeed: curveDef({
                    flowSpeed: p.exclamDotFlowSpeed,
                  }).flowSpeed,
                },
                C
              ),
              'olks + tail': folder(
                {
                  olksTailVisible: curveDef({ visible: p.olksTailVisible })
                    .visible,
                  olksTailParticleCount: curveDef({
                    particleCount: p.olksTailParticleCount,
                  }).particleCount,
                  olksTailParticleSize: curveDef({
                    particleSize: p.olksTailParticleSize,
                  }).particleSize,
                  olksTailOpacity: curveDef({ opacity: p.olksTailOpacity })
                    .opacity,
                  olksTailFlowSpeed: curveDef({
                    flowSpeed: p.olksTailFlowSpeed,
                  }).flowSpeed,
                },
                C
              ),
            },
            C
          ),
        },
        C
      ),

      Bang: folder(
        {
          Rig: folder(
            {
              bangRigX: {
                label: 'X',
                value: p.bangRigX,
                min: s(-400),
                max: s(400),
                step: s(1),
              },
              bangRigY: {
                label: 'Y',
                value: p.bangRigY,
                min: s(-400),
                max: s(400),
                step: s(1),
              },
              bangRigZ: {
                label: 'Z',
                value: p.bangRigZ,
                min: s(-400),
                max: s(400),
                step: s(1),
              },
              bangRigRotateX: {
                label: 'Rotate X',
                value: p.bangRigRotateX,
                min: -180,
                max: 180,
                step: 1,
              },
              bangRigRotateY: {
                label: 'Rotate Y',
                value: p.bangRigRotateY,
                min: -180,
                max: 180,
                step: 1,
              },
              bangRigRotateZ: {
                label: 'Rotate Z',
                value: p.bangRigRotateZ,
                min: -180,
                max: 180,
                step: 1,
              },
            },
            C
          ),
          Barrel: folder(
            {
              barrelLength: {
                label: 'Length',
                value: p.barrelLength,
                min: s(20),
                max: s(400),
                step: s(2),
              },
              barrelRadius: {
                label: 'Radius',
                value: p.barrelRadius,
                min: s(2),
                max: s(40),
                step: s(1),
              },
              barrelSegments: {
                label: 'Segments',
                value: p.barrelSegments,
                min: 6,
                max: 48,
                step: 1,
              },
              barrelColor: {
                label: 'Color',
                value: p.barrelColor,
              },
              barrelMetalness: {
                label: 'Metalness',
                value: p.barrelMetalness,
                min: 0,
                max: 1,
                step: 0.01,
              },
              barrelRoughness: {
                label: 'Roughness',
                value: p.barrelRoughness,
                min: 0,
                max: 1,
                step: 0.01,
              },
            },
            C
          ),
          Flag: folder(
            {
              flagWidth: {
                label: 'Width',
                value: p.flagWidth,
                min: s(30),
                max: s(300),
                step: s(2),
              },
              flagHeight: {
                label: 'Height',
                value: p.flagHeight,
                min: s(30),
                max: s(240),
                step: s(2),
              },
              flagSegmentsX: {
                label: 'Seg X',
                value: p.flagSegmentsX,
                min: 4,
                max: 60,
                step: 1,
              },
              flagSegmentsY: {
                label: 'Seg Y',
                value: p.flagSegmentsY,
                min: 4,
                max: 60,
                step: 1,
              },
              flagWind: {
                label: 'Wind',
                value: p.flagWind,
                min: 0,
                max: 6,
                step: 0.05,
              },
              flagWindDirX: {
                label: 'Wind Dir X',
                value: p.flagWindDirX,
                min: -1,
                max: 1,
                step: 0.01,
              },
              flagWindDirZ: {
                label: 'Wind Dir Z',
                value: p.flagWindDirZ,
                min: -1,
                max: 1,
                step: 0.01,
              },
              flagStiffness: {
                label: 'Stiffness',
                value: p.flagStiffness,
                min: 0,
                max: 1,
                step: 0.01,
              },
              flagDampening: {
                label: 'Dampening',
                value: p.flagDampening,
                min: 0.9,
                max: 1,
                step: 0.001,
              },
              flagShape: {
                label: 'Shape',
                value: p.flagShape,
                options: ['rectangle', 'ribbon-notched'],
              },
              flagTextureUrl: {
                label: 'Texture',
                value: p.flagTextureUrl,
                options: {
                  Bang: p.flagTextureUrl,
                  None: '',
                },
              },
              flagTextureScaleX: {
                label: 'Tex Scale X',
                value: p.flagTextureScaleX,
                min: 0.1,
                max: 4,
                step: 0.05,
              },
              flagTextureScaleY: {
                label: 'Tex Scale Y',
                value: p.flagTextureScaleY,
                min: 0.1,
                max: 4,
                step: 0.05,
              },
              flagTextureRotation: {
                label: 'Tex Rotation',
                value: p.flagTextureRotation,
                min: -180,
                max: 180,
                step: 1,
              },
              flagTextureTile: {
                label: 'Tile Texture',
                value: p.flagTextureTile,
              },
              flagColor: {
                label: 'Color',
                value: p.flagColor,
              },
              flagRoughness: {
                label: 'Roughness',
                value: p.flagRoughness,
                min: 0,
                max: 1,
                step: 0.01,
              },
              flagMetalness: {
                label: 'Metalness',
                value: p.flagMetalness,
                min: 0,
                max: 1,
                step: 0.01,
              },
              flagOpacity: {
                label: 'Opacity',
                value: p.flagOpacity,
                min: 0,
                max: 1,
                step: 0.01,
              },
              flagSheen: {
                label: 'Sheen',
                value: p.flagSheen,
                min: 0,
                max: 1,
                step: 0.01,
              },
              flagSheenRoughness: {
                label: 'Sheen Roughness',
                value: p.flagSheenRoughness,
                min: 0,
                max: 1,
                step: 0.01,
              },
              flagSheenColor: {
                label: 'Sheen Color',
                value: p.flagSheenColor,
              },
              flagClearcoat: {
                label: 'Clearcoat',
                value: p.flagClearcoat,
                min: 0,
                max: 1,
                step: 0.01,
              },
              flagClearcoatRoughness: {
                label: 'Clearcoat Roughness',
                value: p.flagClearcoatRoughness,
                min: 0,
                max: 1,
                step: 0.01,
              },
            },
            C
          ),
          Interaction: folder(
            {
              flagCursorCollider: {
                label: 'Cursor Collider',
                value: p.flagCursorCollider,
              },
              flagCursorRadius: {
                label: 'Cursor Radius',
                value: p.flagCursorRadius,
                min: s(10),
                max: s(200),
                step: s(2),
              },
              flagCollisionMargin: {
                label: 'Collision Margin',
                value: p.flagCollisionMargin,
                min: 0,
                max: s(40),
                step: s(1),
              },
            },
            C
          ),
        },
        C
      ),
    }),
    C
  );

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  const curves = useMemo(() => buildCurves(controls), [controls]);

  return useMemo(
    () => ({
      ...controls,
      tension: 0.8,
      closed: false,
      curves,
    }),
    [controls, curves]
  );
}
