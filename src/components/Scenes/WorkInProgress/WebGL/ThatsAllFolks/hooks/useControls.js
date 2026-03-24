import { folder, useControls } from 'leva';

import { useMemo } from 'react';

// ─── Per-curve Leva folder definition helper ─────────────────────────────────
function curveDef(defaults = {}) {
  const {
    visible = true,
    particleCount = 3000,
    particleSize = 22,
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
      min: 5,
      max: 100,
      step: 1,
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

export default function useSceneControls() {
  const [
    {
      // gun
      gunScale,
      gunX,
      gunY,
      gunZ,
      // smoke group
      particleColor,
      smokeType,
      blendMode,
      smokeScale,
      smokeX,
      smokeY,
      smokeZ,
      showHelpers,
      // particle physics
      springK,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
      growth,
      fadeExponent,
      buoyancy,
      rotSpeed,
      // volumetric physics
      volSpringK,
      volDamping,
      volTurbulence,
      volTurbulenceSpeed,
      volSpread,
      volMaxDrift,
      volFadeRate,
      // Capital T
      capitalTVisible,
      capitalTParticleCount,
      capitalTParticleSize,
      capitalTOpacity,
      capitalTFlowSpeed,
      // hats (h, a, t, s)
      hatsVisible,
      hatsParticleCount,
      hatsParticleSize,
      hatsOpacity,
      hatsFlowSpeed,
      // T crossbar
      crossbarVisible,
      crossbarParticleCount,
      crossbarParticleSize,
      crossbarOpacity,
      crossbarFlowSpeed,
      // apostrophe
      apostropheVisible,
      apostropheParticleCount,
      apostropheParticleSize,
      apostropheOpacity,
      apostropheFlowSpeed,
      // All
      allLettersVisible,
      allLettersParticleCount,
      allLettersParticleSize,
      allLettersOpacity,
      allLettersFlowSpeed,
      // Capital F
      capitalFVisible,
      capitalFParticleCount,
      capitalFParticleSize,
      capitalFOpacity,
      capitalFFlowSpeed,
      // Exclamation shaft
      exclamLineVisible,
      exclamLineParticleCount,
      exclamLineParticleSize,
      exclamLineOpacity,
      exclamLineFlowSpeed,
      // Exclamation dot
      exclamDotVisible,
      exclamDotParticleCount,
      exclamDotParticleSize,
      exclamDotOpacity,
      exclamDotFlowSpeed,
      // olks + tail
      olksTailVisible,
      olksTailParticleCount,
      olksTailParticleSize,
      olksTailOpacity,
      olksTailFlowSpeed,
      // sub-group positions (relative to smoke group)
      thatsX,
      thatsY,
      thatsZ,
      allX,
      allY,
      allZ,
      folksX,
      folksY,
      folksZ,
      exclamX,
      exclamY,
      exclamZ,
      // scene
      bgColor,
      bloomIntensity,
      bloomThreshold,
      bloomSmoothing,
      // lighting
      ambientIntensity,
      ambientColor,
      spotIntensity,
      spotColor,
      spotDecay,
      spotX,
      spotY,
      spotZ,
    },
  ] = useControls('Thats All Folks', () => ({
    Scene: folder(
      {
        bgColor: { label: 'Background', value: '#18100a' },
        Bloom: folder(
          {
            bloomIntensity: {
              label: 'Intensity',
              value: 0.55,
              min: 0,
              max: 5,
              step: 0.05,
            },
            bloomThreshold: {
              label: 'Threshold',
              value: 0.1,
              min: 0,
              max: 1,
              step: 0.01,
            },
            bloomSmoothing: {
              label: 'Smoothing',
              value: 0.88,
              min: 0,
              max: 1,
              step: 0.01,
            },
          },
          { collapsed: true }
        ),

        Lighting: folder(
          {
            Ambient: folder(
              {
                ambientIntensity: {
                  label: 'Intensity',
                  value: 1.5,
                  min: 0,
                  max: 10,
                  step: 0.1,
                },
                ambientColor: { label: 'Color', value: '#ffe8c0' },
              },
              { collapsed: true }
            ),
            Spot: folder(
              {
                spotIntensity: {
                  label: 'Intensity',
                  value: 25,
                  min: 0,
                  max: 200,
                  step: 1,
                },
                spotColor: { label: 'Color', value: '#fff5e0' },
                spotDecay: {
                  label: 'Decay',
                  value: 0,
                  min: 0,
                  max: 4,
                  step: 0.1,
                },
                spotX: {
                  label: 'X',
                  value: 500,
                  min: -2000,
                  max: 2000,
                  step: 10,
                },
                spotY: {
                  label: 'Y',
                  value: 1400,
                  min: -2000,
                  max: 3000,
                  step: 10,
                },
                spotZ: {
                  label: 'Z',
                  value: 700,
                  min: -2000,
                  max: 2000,
                  step: 10,
                },
              },
              { collapsed: true }
            ),
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),

    Gun: folder(
      {
        gunScale: { label: 'Scale', value: 1500, min: 50, max: 2000, step: 10 },
        gunX: { label: 'X', value: -200, min: -800, max: 800, step: 5 },
        gunY: { label: 'Y', value: 250, min: -400, max: 600, step: 5 },
        gunZ: { label: 'Z', value: 0, min: -800, max: 800, step: 5 },
      },
      { collapsed: true }
    ),

    Smoke: folder(
      {
        smokeType: {
          label: 'Smoke Type',
          value: 'particle',
          options: ['particle', 'volumetric', 'both'],
        },
        blendMode: {
          label: 'Blend Mode',
          value: 'Normal',
          options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
        },
        particleColor: { label: 'Color', value: '#d0cdc9' },
        smokeScale: {
          label: 'Scale',
          value: 1.5,
          min: 0.1,
          max: 4,
          step: 0.05,
        },
        smokeX: { label: 'X', value: -350, min: -800, max: 800, step: 5 },
        smokeY: { label: 'Y', value: 550, min: -400, max: 800, step: 5 },
        smokeZ: { label: 'Z', value: 34, min: -800, max: 800, step: 5 },
        showHelpers: { label: 'Show Helpers', value: false },

        'Particle Physics': folder(
          {
            springK: {
              label: 'Spring',
              value: 14.0,
              min: 0,
              max: 40,
              step: 0.5,
            },
            damping: {
              label: 'Damping',
              value: 0.12,
              min: 0.001,
              max: 1,
              step: 0.005,
            },
            turbulence: {
              label: 'Turbulence',
              value: 45,
              min: 0,
              max: 600,
              step: 5,
            },
            turbulenceSpeed: {
              label: 'Turb Speed',
              value: 0.28,
              min: 0,
              max: 3,
              step: 0.05,
            },
            spawnSpread: {
              label: 'Spawn Spread',
              value: 35,
              min: 0,
              max: 400,
              step: 5,
            },
            maxDrift: {
              label: 'Max Drift',
              value: 160,
              min: 50,
              max: 2000,
              step: 50,
            },
            fadeRate: {
              label: 'Fade Rate',
              value: 30,
              min: 1,
              max: 30,
              step: 1,
            },
            growth: {
              label: 'Size Growth',
              value: 0.7,
              min: 0,
              max: 8,
              step: 0.1,
            },
            fadeExponent: {
              label: 'Age Fade',
              value: 4.65,
              min: 0.3,
              max: 5,
              step: 0.1,
            },
            buoyancy: {
              label: 'Buoyancy',
              value: 5,
              min: 0,
              max: 200,
              step: 5,
            },
            rotSpeed: {
              label: 'Rot Speed',
              value: 0.25,
              min: 0,
              max: 2,
              step: 0.05,
            },
          },
          { collapsed: true }
        ),

        'Volumetric Physics': folder(
          {
            volSpringK: {
              label: 'Spring',
              value: 2.5,
              min: 0,
              max: 40,
              step: 0.5,
            },
            volDamping: {
              label: 'Damping',
              value: 0.1,
              min: 0.001,
              max: 1,
              step: 0.005,
            },
            volTurbulence: {
              label: 'Turbulence',
              value: 180,
              min: 0,
              max: 800,
              step: 10,
            },
            volTurbulenceSpeed: {
              label: 'Turb Speed',
              value: 0.25,
              min: 0,
              max: 3,
              step: 0.05,
            },
            volSpread: {
              label: 'Spawn Spread',
              value: 120,
              min: 0,
              max: 600,
              step: 5,
            },
            volMaxDrift: {
              label: 'Max Drift',
              value: 900,
              min: 50,
              max: 2000,
              step: 50,
            },
            volFadeRate: {
              label: 'Fade Rate',
              value: 8,
              min: 1,
              max: 30,
              step: 1,
            },
          },
          { collapsed: true }
        ),

        Groups: folder(
          {
            "That's": folder(
              {
                thatsX: { label: 'X', value: -4, min: -500, max: 500, step: 1 },
                thatsY: { label: 'Y', value: 2, min: -500, max: 500, step: 1 },
                thatsZ: { label: 'Z', value: 0, min: -500, max: 500, step: 1 },
              },
              { collapsed: true }
            ),
            All: folder(
              {
                allX: { label: 'X', value: 5, min: -500, max: 500, step: 1 },
                allY: { label: 'Y', value: 2, min: -500, max: 500, step: 1 },
                allZ: { label: 'Z', value: 0, min: -500, max: 500, step: 1 },
              },
              { collapsed: true }
            ),
            Folks: folder(
              {
                folksX: { label: 'X', value: 0, min: -500, max: 500, step: 1 },
                folksY: { label: 'Y', value: 0, min: -500, max: 500, step: 1 },
                folksZ: { label: 'Z', value: 0, min: -500, max: 500, step: 1 },
              },
              { collapsed: true }
            ),
            Exclamation: folder(
              {
                exclamX: { label: 'X', value: 7, min: -500, max: 500, step: 1 },
                exclamY: {
                  label: 'Y',
                  value: 12,
                  min: -500,
                  max: 500,
                  step: 1,
                },
                exclamZ: { label: 'Z', value: 0, min: -500, max: 500, step: 1 },
              },
              { collapsed: true }
            ),
          },
          { collapsed: true }
        ),

        Splines: folder(
          {
            'Capital T': folder(
              {
                capitalTVisible: curveDef().visible,
                capitalTParticleCount: curveDef({ particleCount: 34000 })
                  .particleCount,
                capitalTParticleSize: curveDef().particleSize,
                capitalTOpacity: curveDef().opacity,
                capitalTFlowSpeed: curveDef().flowSpeed,
              },
              { collapsed: true }
            ),
            'hats (h,a,t,s)': folder(
              {
                hatsVisible: curveDef().visible,
                hatsParticleCount: curveDef({ particleCount: 54000 })
                  .particleCount,
                hatsParticleSize: curveDef().particleSize,
                hatsOpacity: curveDef().opacity,
                hatsFlowSpeed: curveDef().flowSpeed,
              },
              { collapsed: true }
            ),
            'T Crossbar': folder(
              {
                crossbarVisible: curveDef().visible,
                crossbarParticleCount: curveDef({ particleCount: 5000 })
                  .particleCount,
                crossbarParticleSize: curveDef().particleSize,
                crossbarOpacity: curveDef().opacity,
                crossbarFlowSpeed: curveDef().flowSpeed,
              },
              { collapsed: true }
            ),
            Apostrophe: folder(
              {
                apostropheVisible: curveDef().visible,
                apostropheParticleCount: curveDef({ particleCount: 2000 })
                  .particleCount,
                apostropheParticleSize: curveDef().particleSize,
                apostropheOpacity: curveDef().opacity,
                apostropheFlowSpeed: curveDef().flowSpeed,
              },
              { collapsed: true }
            ),
            All: folder(
              {
                allLettersVisible: curveDef().visible,
                allLettersParticleCount: curveDef({ particleCount: 40000 })
                  .particleCount,
                allLettersParticleSize: curveDef().particleSize,
                allLettersOpacity: curveDef().opacity,
                allLettersFlowSpeed: curveDef().flowSpeed,
              },
              { collapsed: true }
            ),
            'Capital F': folder(
              {
                capitalFVisible: curveDef().visible,
                capitalFParticleCount: curveDef({ particleCount: 34000 })
                  .particleCount,
                capitalFParticleSize: curveDef().particleSize,
                capitalFOpacity: curveDef().opacity,
                capitalFFlowSpeed: curveDef().flowSpeed,
              },
              { collapsed: true }
            ),
            'Exclamation !': folder(
              {
                exclamLineVisible: curveDef().visible,
                exclamLineParticleCount: curveDef({ particleCount: 5000 })
                  .particleCount,
                exclamLineParticleSize: curveDef().particleSize,
                exclamLineOpacity: curveDef().opacity,
                exclamLineFlowSpeed: curveDef().flowSpeed,
              },
              { collapsed: true }
            ),
            'Exclamation Dot': folder(
              {
                exclamDotVisible: curveDef().visible,
                exclamDotParticleCount: curveDef({ particleCount: 2000 })
                  .particleCount,
                exclamDotParticleSize: curveDef().particleSize,
                exclamDotOpacity: curveDef().opacity,
                exclamDotFlowSpeed: curveDef().flowSpeed,
              },
              { collapsed: true }
            ),
            'olks + tail': folder(
              {
                olksTailVisible: curveDef().visible,
                olksTailParticleCount: curveDef({ particleCount: 80000 })
                  .particleCount,
                olksTailParticleSize: curveDef().particleSize,
                olksTailOpacity: curveDef().opacity,
                olksTailFlowSpeed: curveDef({ flowSpeed: 0.018 }).flowSpeed,
              },
              { collapsed: true }
            ),
          },
          { collapsed: true }
        ),
      },
      { collapsed: false }
    ),
  }));

  return useMemo(
    () => ({
      showHelpers,
      smokeType,
      blendMode,
      gunScale,
      gunX,
      gunY,
      gunZ,
      smokeScale,
      smokeX,
      smokeY,
      smokeZ,
      // shared smoke + physics (spread into per-curve configs as base)
      particleColor,
      springK,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
      growth,
      fadeExponent,
      buoyancy,
      rotSpeed,
      // volumetric physics
      volSpringK,
      volDamping,
      volTurbulence,
      volTurbulenceSpeed,
      volSpread,
      volMaxDrift,
      volFadeRate,
      tension: 0.8,
      closed: false,
      // scene
      bgColor,
      bloomIntensity,
      bloomThreshold,
      bloomSmoothing,
      // lighting
      ambientIntensity,
      ambientColor,
      spotIntensity,
      spotColor,
      spotDecay,
      spotX,
      spotY,
      spotZ,
      // sub-group positions
      thatsX,
      thatsY,
      thatsZ,
      allX,
      allY,
      allZ,
      folksX,
      folksY,
      folksZ,
      exclamX,
      exclamY,
      exclamZ,
      // per-curve settings — consumed in ThatsAllFolks.jsx
      curves: {
        capitalT: {
          visible: capitalTVisible,
          particleCount: capitalTParticleCount,
          particleSize: capitalTParticleSize,
          opacity: capitalTOpacity,
          flowSpeed: capitalTFlowSpeed,
        },
        hats: {
          visible: hatsVisible,
          particleCount: hatsParticleCount,
          particleSize: hatsParticleSize,
          opacity: hatsOpacity,
          flowSpeed: hatsFlowSpeed,
        },
        crossbar: {
          visible: crossbarVisible,
          particleCount: crossbarParticleCount,
          particleSize: crossbarParticleSize,
          opacity: crossbarOpacity,
          flowSpeed: crossbarFlowSpeed,
        },
        apostrophe: {
          visible: apostropheVisible,
          particleCount: apostropheParticleCount,
          particleSize: apostropheParticleSize,
          opacity: apostropheOpacity,
          flowSpeed: apostropheFlowSpeed,
        },
        allLetters: {
          visible: allLettersVisible,
          particleCount: allLettersParticleCount,
          particleSize: allLettersParticleSize,
          opacity: allLettersOpacity,
          flowSpeed: allLettersFlowSpeed,
        },
        capitalF: {
          visible: capitalFVisible,
          particleCount: capitalFParticleCount,
          particleSize: capitalFParticleSize,
          opacity: capitalFOpacity,
          flowSpeed: capitalFFlowSpeed,
        },
        exclamLine: {
          visible: exclamLineVisible,
          particleCount: exclamLineParticleCount,
          particleSize: exclamLineParticleSize,
          opacity: exclamLineOpacity,
          flowSpeed: exclamLineFlowSpeed,
        },
        exclamDot: {
          visible: exclamDotVisible,
          particleCount: exclamDotParticleCount,
          particleSize: exclamDotParticleSize,
          opacity: exclamDotOpacity,
          flowSpeed: exclamDotFlowSpeed,
        },
        olksTail: {
          visible: olksTailVisible,
          particleCount: olksTailParticleCount,
          particleSize: olksTailParticleSize,
          opacity: olksTailOpacity,
          flowSpeed: olksTailFlowSpeed,
        },
      },
    }),
    [
      showHelpers,
      smokeType,
      gunScale,
      gunX,
      gunY,
      gunZ,
      smokeScale,
      smokeX,
      smokeY,
      smokeZ,
      particleColor,
      springK,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
      growth,
      fadeExponent,
      buoyancy,
      rotSpeed,
      volSpringK,
      volDamping,
      volTurbulence,
      volTurbulenceSpeed,
      volSpread,
      volMaxDrift,
      volFadeRate,
      capitalTVisible,
      capitalTParticleCount,
      capitalTParticleSize,
      capitalTOpacity,
      capitalTFlowSpeed,
      hatsVisible,
      hatsParticleCount,
      hatsParticleSize,
      hatsOpacity,
      hatsFlowSpeed,
      crossbarVisible,
      crossbarParticleCount,
      crossbarParticleSize,
      crossbarOpacity,
      crossbarFlowSpeed,
      apostropheVisible,
      apostropheParticleCount,
      apostropheParticleSize,
      apostropheOpacity,
      apostropheFlowSpeed,
      allLettersVisible,
      allLettersParticleCount,
      allLettersParticleSize,
      allLettersOpacity,
      allLettersFlowSpeed,
      capitalFVisible,
      capitalFParticleCount,
      capitalFParticleSize,
      capitalFOpacity,
      capitalFFlowSpeed,
      exclamLineVisible,
      exclamLineParticleCount,
      exclamLineParticleSize,
      exclamLineOpacity,
      exclamLineFlowSpeed,
      exclamDotVisible,
      exclamDotParticleCount,
      exclamDotParticleSize,
      exclamDotOpacity,
      exclamDotFlowSpeed,
      olksTailVisible,
      olksTailParticleCount,
      olksTailParticleSize,
      olksTailOpacity,
      olksTailFlowSpeed,
      thatsX,
      thatsY,
      thatsZ,
      allX,
      allY,
      allZ,
      folksX,
      folksY,
      folksZ,
      exclamX,
      exclamY,
      exclamZ,
      bgColor,
      bloomIntensity,
      bloomThreshold,
      bloomSmoothing,
      ambientIntensity,
      ambientColor,
      spotIntensity,
      spotColor,
      spotDecay,
      spotX,
      spotY,
      spotZ,
    ]
  );
}
