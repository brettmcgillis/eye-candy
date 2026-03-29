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
      fsSampleCount,
      fsDetail,
      fsSpeed,
      fsDisplacement,
      fsOpacity,
      fsAnimated,
      fsFireCore,
      fsFireMid,
      fsFireOuter,
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
        fsSampleCount: {
          label: 'Sample Count',
          value: 20,
          min: 2,
          max: 80,
          step: 1,
        },
        fsDetail: { label: 'Detail', value: 4, min: 1, max: 7, step: 1 },
        fsSpeed: { label: 'Speed', value: 1.0, min: 0, max: 5, step: 0.05 },
        fsDisplacement: {
          label: 'Displacement',
          value: 0.5,
          min: 0,
          max: 1.5,
          step: 0.01,
        },
        'Fire Colors': folder(
          {
            fsFireCore: { label: 'Core', value: '#ffff88' },
            fsFireMid: { label: 'Mid', value: '#ff6600' },
            fsFireOuter: { label: 'Outer', value: '#880000' },
          },
          { collapsed: false }
        ),
        'Smoke Colors': folder(
          {
            fsSmokeLight: { label: 'Light', value: '#4a4a58' },
            fsSmokeDark: { label: 'Dark', value: '#1a1a22' },
          },
          { collapsed: false }
        ),
        fsOpacity: { label: 'Opacity', value: 1.0, min: 0, max: 1, step: 0.01 },
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
        sampleCount: fsSampleCount,
        detail: fsDetail,
        speed: fsSpeed,
        displacementScale: fsDisplacement,
        fireCoreColor: fsFireCore,
        fireMidColor: fsFireMid,
        fireOuterColor: fsFireOuter,
        smokeLightColor: fsSmokeLight,
        smokeDarkColor: fsSmokeDark,
        opacity: fsOpacity,
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
      fsSampleCount,
      fsDetail,
      fsSpeed,
      fsDisplacement,
      fsFireCore,
      fsFireMid,
      fsFireOuter,
      fsSmokeLight,
      fsSmokeDark,
      fsOpacity,
      fsAnimated,
    ]
  );
}
