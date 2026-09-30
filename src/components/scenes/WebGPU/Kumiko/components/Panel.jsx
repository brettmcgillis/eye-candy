import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import useImageBytes from '@hooks/useImageBytes';
import { SCENE_KEYS } from '@modules/kumiko';
import { createPanelRig } from '@modules/kumikoRender';
import { useWebcamFrame } from '@modules/webcam';

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
const SCENE_ONLY = ['cellEase', 'webcam', 'webcamFacing', 'webcamRate'];
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
    facing: config.webcamFacing,
    rate: config.webcamRate,
  });
  const still = useImageBytes(
    imageOn && !config.webcam ? config.sourceImage : ''
  );
  const image = imageOn ? (webcam ?? still) : null;

  const planKey = JSON.stringify(pick(config, PLAN_KEYS));
  const bakeKey = JSON.stringify(pick(config, BAKE_KEYS));

  // A webcam frame arrives faster than a big panel plans, so a result is
  // drawn whenever it is newer than the one showing, not only when no newer
  // request has been made — or a stream would never draw at all.
  const requestRef = useRef(0);
  const shownRef = useRef(-1);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    requestRef.current += 1;
    const request = requestRef.current;
    const bytes = image && { ...image, data: image.data.slice() };
    build(JSON.parse(planKey), bytes).then((result) => {
      if (!mountedRef.current || !result || request <= shownRef.current) {
        return;
      }
      shownRef.current = request;
      resultRef.current = result;
      rig.setPanel(result, configRef.current, { immediate: firstRef.current });
      firstRef.current = false;
    });
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
