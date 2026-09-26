import React, { memo, useEffect, useMemo } from 'react';

import usePosedHands from '../hooks/usePosedHands';
import createHandsMaterial from '../utils/createHandsMaterial';
import { handsInFrame, shellMatrix } from '../utils/posedHands';
import solveNesting from '../utils/solveNesting';
import PrayerHands from './PrayerHands';

const MATERIAL_PREFIXES = ['ivory', 'oil', 'blood', 'bloodFade'];
const MATERIAL_KEYS = [
  'baseColor',
  'accentColor',
  'amount',
  'scale',
  'iterations',
  'noise',
  'noiseScale',
  'seed',
  'metalness',
  'roughness',
  'clearcoat',
  'tipColor',
  'wristColor',
  'gradientStart',
  'gradientEnd',
];

function capitalize(key) {
  return key[0].toUpperCase() + key.slice(1);
}

function materialOptions(config, prefix) {
  return Object.fromEntries(
    MATERIAL_KEYS.map((key) => [key, config[`${prefix}${capitalize(key)}`]])
  );
}

function useHandsMaterials(config) {
  const optionsKey = JSON.stringify(
    MATERIAL_PREFIXES.map((prefix) => materialOptions(config, prefix))
  );

  const materials = useMemo(() => {
    return Object.fromEntries(
      JSON.parse(optionsKey).map((options, i) => [
        MATERIAL_PREFIXES[i],
        createHandsMaterial(options),
      ])
    );
  }, [optionsKey]);

  useEffect(() => {
    return () => Object.values(materials).forEach((m) => m.dispose());
  }, [materials]);

  return materials;
}

function shellOf(config, prefix) {
  const base = config.handsRotation;
  const own = config[`${prefix}Rotation`];
  return {
    prefix,
    visible: config[`${prefix}Visible`],
    material: config[`${prefix}Material`],
    extraGap: config[`${prefix}Spread`],
    transform: {
      position: config[`${prefix}Position`],
      rotation: base.map((value, i) => value + own[i]),
      scale: config[`${prefix}Scale`],
    },
  };
}

function useShellMatrix(transform, posed) {
  const key = JSON.stringify(transform);
  return useMemo(() => shellMatrix(JSON.parse(key), posed), [key, posed]);
}

function PrayerCluster({ config }) {
  const materials = useHandsMaterials(config);

  const shells = [
    shellOf(config, 'base'),
    shellOf(config, 'middle'),
    shellOf(config, 'outer'),
  ];

  const posed = [
    usePosedHands(config.baseDemographic, config.basePose),
    usePosedHands(config.middleDemographic, config.middlePose),
    usePosedHands(config.outerDemographic, config.outerPose),
  ];

  const matrices = [
    useShellMatrix(shells[0].transform, posed[0]),
    useShellMatrix(shells[1].transform, posed[1]),
    useShellMatrix(shells[2].transform, posed[2]),
  ];

  const nestingKey = JSON.stringify([
    shells.map((shell) => [shell.visible, shell.extraGap]),
    config.fitEnabled,
    config.fitGap,
    config.fitTilt,
    config.fitCurl,
    config.fitSwing,
  ]);

  const corrections = useMemo(() => {
    const [visibility, fitEnabled, gap, maxTilt, maxCurl, maxSwing] =
      JSON.parse(nestingKey);
    const result = [null, null, null];
    if (!fitEnabled) return result;

    const active = [0, 1, 2].filter((i) => visibility[i][0]);
    const solved = solveNesting(
      active.map((i) => ({
        extraGap: visibility[i][1],
        hands: handsInFrame(posed[i].hands, matrices[i]),
      })),
      { gap, maxTilt, maxCurl, maxSwing }
    );
    active.forEach((i, k) => {
      result[i] = solved[k];
    });
    return result;
  }, [nestingKey, ...posed, ...matrices]);

  return (
    <group>
      {shells.map(
        (shell, i) =>
          shell.visible && (
            <PrayerHands
              key={shell.prefix}
              posed={posed[i]}
              matrix={matrices[i]}
              corrections={corrections[i]}
              material={materials[shell.material] || materials.ivory}
              withGradient={shell.material === 'bloodFade'}
            />
          )
      )}
    </group>
  );
}

export default memo(PrayerCluster);
