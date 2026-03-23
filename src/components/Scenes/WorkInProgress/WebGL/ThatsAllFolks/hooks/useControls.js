import { folder, useControls } from 'leva';

import { useMemo } from 'react';

// ─── Per-curve Leva folder definition helper ─────────────────────────────────
function curveDef(defaults = {}) {
  const {
    visible = true,
    particleCount = 3000,
    particleSize = 35,
    opacity = 0.044,
    flowSpeed = 0.022,
  } = defaults;
  return {
    visible: { label: 'Visible', value: visible },
    particleCount: {
      label: 'Particles',
      value: particleCount,
      min: 100,
      max: 15000,
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
      showHelpers,
      // gun
      gunScale,
      gunY,
      barrelTipY,
      // smoke global
      particleColor,
      // physics global
      springK,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
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
    },
  ] = useControls('Thats All Folks', () => ({
    Scene: folder(
      { showHelpers: { label: 'Show Helpers', value: false } },
      { collapsed: false }
    ),

    Gun: folder(
      {
        gunScale: { label: 'Scale', value: 1500, min: 50, max: 2000, step: 10 },
        gunY: { label: 'Position Y', value: 50, min: -400, max: 600, step: 5 },
        barrelTipY: {
          label: 'Barrel Tip Y',
          value: 285,
          min: 50,
          max: 700,
          step: 5,
        },
      },
      { collapsed: true }
    ),

    Smoke: folder(
      { particleColor: { label: 'Color', value: '#d0cdc9' } },
      { collapsed: false }
    ),

    Physics: folder(
      {
        springK: { label: 'Spring', value: 5.0, min: 0, max: 40, step: 0.5 },
        damping: {
          label: 'Damping',
          value: 0.1,
          min: 0.001,
          max: 1,
          step: 0.005,
        },
        turbulence: {
          label: 'Turbulence',
          value: 95,
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
          value: 90,
          min: 0,
          max: 400,
          step: 5,
        },
        maxDrift: {
          label: 'Max Drift',
          value: 480,
          min: 50,
          max: 2000,
          step: 50,
        },
        fadeRate: { label: 'Fade Rate', value: 6, min: 1, max: 30, step: 1 },
      },
      { collapsed: true }
    ),

    Splines: folder(
      {
        'Capital T': folder(
          {
            capitalTVisible: curveDef().visible,
            capitalTParticleCount: curveDef().particleCount,
            capitalTParticleSize: curveDef().particleSize,
            capitalTOpacity: curveDef().opacity,
            capitalTFlowSpeed: curveDef().flowSpeed,
          },
          { collapsed: true }
        ),
        'hats (h,a,t,s)': folder(
          {
            hatsVisible: curveDef().visible,
            hatsParticleCount: curveDef().particleCount,
            hatsParticleSize: curveDef().particleSize,
            hatsOpacity: curveDef().opacity,
            hatsFlowSpeed: curveDef().flowSpeed,
          },
          { collapsed: true }
        ),
        'T Crossbar': folder(
          {
            crossbarVisible: curveDef().visible,
            crossbarParticleCount: curveDef({ particleCount: 1000 })
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
            apostropheParticleCount: curveDef({ particleCount: 500 })
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
            allLettersParticleCount: curveDef().particleCount,
            allLettersParticleSize: curveDef().particleSize,
            allLettersOpacity: curveDef().opacity,
            allLettersFlowSpeed: curveDef().flowSpeed,
          },
          { collapsed: true }
        ),
        'Capital F': folder(
          {
            capitalFVisible: curveDef().visible,
            capitalFParticleCount: curveDef().particleCount,
            capitalFParticleSize: curveDef().particleSize,
            capitalFOpacity: curveDef().opacity,
            capitalFFlowSpeed: curveDef().flowSpeed,
          },
          { collapsed: true }
        ),
        'Exclamation !': folder(
          {
            exclamLineVisible: curveDef().visible,
            exclamLineParticleCount: curveDef({ particleCount: 1000 })
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
            exclamDotParticleCount: curveDef({ particleCount: 300 })
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
            olksTailParticleCount: curveDef({ particleCount: 8000 })
              .particleCount,
            olksTailParticleSize: curveDef().particleSize,
            olksTailOpacity: curveDef().opacity,
            olksTailFlowSpeed: curveDef({ flowSpeed: 0.018 }).flowSpeed,
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
      gunScale,
      gunY,
      barrelTipY,
      // shared smoke + physics (spread into per-curve configs as base)
      particleColor,
      springK,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
      tension: 0.8,
      closed: false,
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
      gunScale,
      gunY,
      barrelTipY,
      particleColor,
      springK,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
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
    ]
  );
}
