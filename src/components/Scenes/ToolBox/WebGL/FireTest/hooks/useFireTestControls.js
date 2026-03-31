import { folder, useControls } from 'leva';

import { useMemo } from 'react';

export default function useFireTestControls() {
  const [
    {
      // Scene
      bgColor,
      lineColor,
      // Spline editor
      showSplinePoints,
      showSplineLine,
      pointMode,
      // Fireball
      fbRadius,
      fbDetail,
      fbSpeed,
      fbWeight,
      fbAnimated,
      fbPosX,
      fbPosY,
      fbPosZ,
      // FireballSpline
      fsBaseRadius,
      fsTubular,
      fsRadial,
      fsCap,
      fsSpeed,
      fsWeight,
      fsAnimated,
      fsSmokeLight,
      fsSmokeDark,
    },
  ] = useControls('Fire Test', () => ({
    Scene: folder(
      {
        bgColor: { label: 'Background', value: '#000000' },
        lineColor: { label: 'Grid Lines', value: '#252548' },
      },
      { collapsed: false }
    ),

    Fireball: folder(
      {
        Position: folder(
          {
            fbPosX: { label: 'X', value: 0, min: -1000, max: 1000, step: 1 },
            fbPosY: { label: 'Y', value: 0, min: -500, max: 1000, step: 1 },
            fbPosZ: { label: 'Z', value: 0, min: -500, max: 500, step: 1 },
          },
          { collapsed: true }
        ),
        fbRadius: { label: 'Radius', value: 20, min: 5, max: 400, step: 1 },
        fbDetail: { label: 'Detail', value: 5, min: 1, max: 7, step: 1 },
        fbSpeed: { label: 'Speed', value: 1.0, min: 0, max: 5, step: 0.05 },
        fbWeight: { label: 'Weight', value: 10.0, min: 0, max: 30, step: 0.5 },
        fbAnimated: { label: 'Animated', value: true },
      },
      { collapsed: false }
    ),

    'Fire Spline': folder(
      {
        fsBaseRadius: {
          label: 'Base Radius',
          value: 60,
          min: 5,
          max: 400,
          step: 1,
        },
        fsTubular: {
          label: 'Tubular Segments',
          value: 64,
          min: 8,
          max: 128,
          step: 1,
        },
        fsRadial: {
          label: 'Radial Segments',
          value: 32,
          min: 8,
          max: 64,
          step: 1,
        },
        fsCap: {
          label: 'Cap Segments',
          value: 8,
          min: 2,
          max: 16,
          step: 1,
        },
        fsSpeed: { label: 'Speed', value: 1.0, min: 0, max: 5, step: 0.05 },
        fsWeight: {
          label: 'Weight',
          value: 10.0,
          min: 0,
          max: 30,
          step: 0.5,
        },
        'Smoke Colors': folder(
          {
            fsSmokeLight: { label: 'Light', value: '#4a4a58' },
            fsSmokeDark: { label: 'Dark', value: '#1a1a22' },
          },
          { collapsed: false }
        ),
        fsAnimated: { label: 'Animated', value: true },
      },
      { collapsed: false }
    ),

    'Spline Editor': folder(
      {
        showSplinePoints: { label: 'Show Points', value: true },
        showSplineLine: { label: 'Show Curve', value: true },
        pointMode: {
          label: 'Transform',
          value: 'translate',
          options: ['translate', 'scale'],
        },
      },
      { collapsed: false }
    ),
  }));

  return useMemo(
    () => ({
      bgColor,
      lineColor,
      showSplinePoints,
      showSplineLine,
      pointMode,
      fireball: {
        position: [fbPosX, fbPosY, fbPosZ],
        radius: fbRadius,
        detail: fbDetail,
        speed: fbSpeed,
        weight: fbWeight,
        animated: fbAnimated,
      },
      fireSpline: {
        baseRadius: fsBaseRadius,
        tubularSegments: fsTubular,
        radialSegments: fsRadial,
        capSegments: fsCap,
        speed: fsSpeed,
        weight: fsWeight,
        smokeLightColor: fsSmokeLight,
        smokeDarkColor: fsSmokeDark,
        animated: fsAnimated,
      },
    }),
    [
      bgColor,
      lineColor,
      showSplinePoints,
      showSplineLine,
      pointMode,
      fbPosX,
      fbPosY,
      fbPosZ,
      fbRadius,
      fbDetail,
      fbSpeed,
      fbWeight,
      fbAnimated,
      fsBaseRadius,
      fsTubular,
      fsRadial,
      fsCap,
      fsSpeed,
      fsWeight,
      fsSmokeLight,
      fsSmokeDark,
      fsAnimated,
    ]
  );
}
