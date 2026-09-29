import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import useImageBytes from '@hooks/useImageBytes';
import useWebcamFrame from '@hooks/useWebcamFrame';
import { SCENE_KEYS } from '@modules/kumiko';
import { createPanelRig } from '@modules/kumikoRender';

import useLeavesBuilder from '../hooks/useLeavesBuilder';

// Only uniforms: a palette, colour or light edit never re-plans a cell.
const LOOK_KEYS = [
  'backgroundColor',
  'backlight',
  'colorTarget',
  'palette',
  'paletteExact',
  'paletteRepeat',
  'paletteShift',
  'paperColor',
  'roughness',
  'showPaper',
  'woodColor',
  'woodGrain',
];
// Re-bake the cells' geometry but keep the plan.
const BAKE_KEYS = [
  'construction',
  'infillDepth',
  'infillRecess',
  'jigumiDepth',
  'jointGap',
  'borderDepth',
];
const SCENE_ONLY = ['cellEase', 'webcam', 'webcamRate'];
const PLAN_KEYS = SCENE_KEYS.filter(
  (key) => ![...LOOK_KEYS, ...BAKE_KEYS, ...SCENE_ONLY].includes(key)
);

const pick = (config, keys) =>
  Object.fromEntries(keys.map((key) => [key, config[key]]));

function Panel({ config }) {
  const rig = useMemo(() => createPanelRig(), []);
  const build = useLeavesBuilder();
  const configRef = useRef(config);
  configRef.current = config;
  const resultRef = useRef(null);
  const firstRef = useRef(true);

  const imageOn = config.imageMode !== 'off';
  const webcam = useWebcamFrame(imageOn && config.webcam, {
    rate: config.webcamRate,
  });
  const still = useImageBytes(
    imageOn && !config.webcam ? config.sourceImage : ''
  );
  const image = imageOn ? (webcam ?? still) : null;

  const planKey = JSON.stringify(pick(config, PLAN_KEYS));
  const bakeKey = JSON.stringify(pick(config, BAKE_KEYS));

  useEffect(() => {
    let live = true;
    const bytes = image && { ...image, data: image.data.slice() };
    build(JSON.parse(planKey), bytes).then((result) => {
      if (!live || !result) return;
      resultRef.current = result;
      rig.setPanel(result, configRef.current, { immediate: firstRef.current });
      firstRef.current = false;
    });
    return () => {
      live = false;
    };
  }, [build, image, planKey, rig]);

  useEffect(() => {
    if (resultRef.current) rig.setPanel(resultRef.current, configRef.current);
  }, [bakeKey, rig]);

  const lookKey = JSON.stringify(pick(config, LOOK_KEYS));
  useEffect(() => {
    rig.setConfig(configRef.current);
  }, [lookKey, rig]);

  useFrame((_, dt) => rig.tick(Math.min(dt, 0.1), configRef.current.cellEase));

  useEffect(() => () => rig.dispose(), [rig]);

  return <primitive object={rig.group} />;
}

export default memo(Panel);
